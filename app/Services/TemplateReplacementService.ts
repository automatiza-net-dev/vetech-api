import { inject } from "@adonisjs/fold";
import { ModelObject } from "@ioc:Adonis/Lucid/Orm";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnit from "App/Models/BusinessUnit";
import DocumentTemplate from "App/Models/DocumentTemplate";
import Drive from "@ioc:Adonis/Core/Drive";
import Patient, {
	PatientGender,
	PatientVaccineOrigin,
} from "App/Models/Patient";
import Schedule from "App/Models/Schedule";
import TemplateReplacement, {
	TemplateReplacementOrigin,
} from "App/Models/TemplateReplacement";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import ITemplateReplacementData, {
	ITemplateReplacementParser,
} from "Contracts/interfaces/ITemplateReplacementData";
import { differenceInYears, format } from "date-fns";
import * as Locales from "date-fns/locale";
import Env from "@ioc:Adonis/Core/Env";
import Application from "@ioc:Adonis/Core/Application";
import { v4 } from "uuid";
import { exec } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { PDFEngine } from "chromiumly";
import { DateTime } from "luxon";
import Bill from "App/Models/Bill";
import Database from "@ioc:Adonis/Lucid/Database";

interface ISearch {
	origin?: string;
	attribute?: string;
	replacer?: string;
}

type RenderTextData = Record<TemplateReplacementOrigin, ModelObject | null>;

@inject()
export default class TemplateReplacementService {
	constructor(private readonly sharedService: SharedService) {}

	async index(authCtx: AuthContext, data: ISearch) {
		const qb = TemplateReplacement.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id);

		if (data.origin) {
			qb.where("origin", data.origin);
		}

		if (data.attribute) {
			qb.whereILike("attribute", data.attribute);
		}

		if (data.replacer) {
			qb.whereILike("replacer", data.replacer);
		}

		return qb;
	}

	async store(authCtx: AuthContext, data: ITemplateReplacementData) {
		if (data.origin === TemplateReplacementOrigin.SYSTEM) {
			throw new BadRequestException(
				"Você não pode criar esse tipo",
				400,
				"E_ERR",
			);
		}

		return TemplateReplacement.create({
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			attribute: data.attribute,
			origin: data.origin,
			replacer: data.replacer,
		});
	}

	async update(
		authCtx: AuthContext,
		id: string,
		data: ITemplateReplacementData,
	) {
		const template = await TemplateReplacement.query()
			.where("economic_group_id", authCtx.group.id)
			.where("id", id)
			.first();

		if (!template) {
			throw this.sharedService.ResourceNotFound();
		}

		return template
			.merge({
				attribute: data.attribute,
				origin: data.origin,
				replacer: data.replacer,
			})
			.save();
	}

	async destroy(authCtx: AuthContext, id: string) {
		const template = await TemplateReplacement.query()
			.where("economic_group_id", authCtx.group.id)
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!template) {
			throw this.sharedService.ResourceNotFound();
		}

		return template.delete();
	}

	async renderText(authCtx: AuthContext, data: ITemplateReplacementParser) {
		if (!data.base && !data.documentId) {
			throw new BadRequestException("Documento ou base não enviados");
		}

		const date = DateTime.now().minus({ hours: 3 }).toJSDate();
		const textData: RenderTextData = {
			BUSINESS: null,
			USER: null,
			SCHEDULE: null,
			TUTOR: null,
			PATIENT: null,
			SYSTEM: {
				date: format(date, "dd/MM/yyyy", {
					locale: Locales.ptBR,
				}),
				dateextension: format(date, "dd 'de' MMMM 'de' yyyy", {
					locale: Locales.ptBR,
				}),
				time: format(date, "HH:mm", {
					locale: Locales.ptBR,
				}),
			},
			CONTRACTS: null,
			CONTRACTOR: null,
		};

		if (data.businessUnitId) {
			textData.BUSINESS = await this.fetchUnit(data.businessUnitId);
		}

		if (data.userId) {
			textData.USER = await this.fetchUser(data.userId, data.businessUnitId);
		}

		if (data.scheduleId) {
			const schedule = await Schedule.findOrFail(data.scheduleId);
			textData.SCHEDULE = schedule.toObject();
		}

		if (data.tutorId) {
			textData.TUTOR = await this.fetchTutor(data.tutorId);
		}

		if (data.dependentId) {
			textData.PATIENT = await this.fetchPatient(data.dependentId);
		}

		if (data.billId) {
			textData.CONTRACTS = await this.fetchBillContracts(data.billId);
			textData.CONTRACTOR = await this.fetchContractor(data.billId);
		}

		const templates = await TemplateReplacement.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id);

		if (data.base && !data.documentId) {
			return {
				result: this.parseTextTemplate(data.base, textData, templates),
			};
		}

		const template = await DocumentTemplate.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id)
			.where("id", data.documentId!)
			.first();

		if (!template) {
			throw this.sharedService.ResourceNotFound();
		}

		if (template.type === "pdf") {
			const fileBuffer = await Drive.use("s3").get(template.sourceFile);
			if (!fileBuffer) {
				throw new BadRequestException(
					"Não foi possível achar o arquivo",
					400,
					"",
				);
			}

			const key = v4();
			const dataPath = `tmp/${key}_data.json`;
			const templatesPath = `tmp/${key}_templates.json`;
			const inputPath = `tmp/${key}.docx`;
			const outputPath = `tmp/${key}_output.docx`;
			const pdfKey = `documents/compiled/${key}.pdf`;

			const fullDataPath = `${Env.get(
				"LOCAL_DISK_ROOT",
				Application.tmpPath(),
			)}/uploads/${dataPath}`;

			const fullTemplatesPath = `${Env.get(
				"LOCAL_DISK_ROOT",
				Application.tmpPath(),
			)}/uploads/${templatesPath}`;

			const fullInputPath = `${Env.get(
				"LOCAL_DISK_ROOT",
				Application.tmpPath(),
			)}/uploads/${inputPath}`;

			const fullOutputPath = `${Env.get(
				"LOCAL_DISK_ROOT",
				Application.tmpPath(),
			)}/uploads/${outputPath}`;

			await Promise.all([
				await writeFile(fullInputPath, fileBuffer),
				await writeFile(fullDataPath, JSON.stringify(textData)),
				await writeFile(
					fullTemplatesPath,
					JSON.stringify(
						templates.map((t) => ({
							origin: t.origin,
							attribute: t.attribute,
							replacer: t.replacer,
						})),
					),
				),
			]);

			const success = await new Promise<boolean>((res) => {
				exec(
					`${Env.get(
						"TRANSPILER_PATH",
					)} ${fullInputPath} ${fullOutputPath} ${fullTemplatesPath} ${fullDataPath}`,
					(error, _stdout, _stderr) => {
						if (error) {
							console.error(error);
							// return rej(false);
							return res(false);
						}

						return res(true);
					},
				);
			});

			if (!success) {
				throw new BadRequestException("Erro processando arquivo", 400, "");
			}

			const responseBuffer = await PDFEngine.convert({
				files: [fullOutputPath],
			});

			await Drive.use("s3").put(pdfKey, responseBuffer, {
				contentType: "application/pdf",
			});

			return {
				filename: `${key}.pdf`,
				key: pdfKey,
			};
		}

		return {
			text: this.parseTextTemplate(template.template, textData, templates),
		};
	}

	parseTextTemplate(
		raw: string,
		data: RenderTextData,
		templates: TemplateReplacement[],
	): string {
		if (templates.length === 0) {
			return raw;
		}

		const [head, ...tail] = templates;

		const elem = data[head.origin];
		if (!elem) {
			return this.parseTextTemplate(raw, data, tail);
		}

		const value = this.$getValue(head.attribute, elem);
		const value$ = value ? this.$toString(value) ?? head.attribute : "";

		const updated = raw.replaceAll(head.replacer, value$);

		return this.parseTextTemplate(updated, data, tail);
	}

	$getValue(key: string, obj: ModelObject) {
		if (Array.isArray(obj)) {
			return obj;
		}

		if (obj[key]) {
			return obj[key];
		}

		const diff = this.snakeToCamelCase(key);
		if (obj[diff]) {
			return obj[diff];
		}

		return null;
	}

	$toString(data: unknown) {
		if (Array.isArray(data)) {
			return `\n${data
				.map((d) => this.$toString(d))
				.filter(Boolean)
				.map((d) => ` - ${d}`)
				.join("\n")}`;
		}

		if (typeof data === "string") {
			return data;
		}

		if (typeof data === "number" || typeof data === "bigint") {
			return data.toString();
		}

		if (typeof data === "boolean") {
			return data ? "Sim" : "Não";
		}

		if (data instanceof Date) {
			return data.toDateString();
		}

		return null;
	}

	async fetchTutor(id: string) {
		const tutor = await Patient.query()
			.where("id", id)
			.preload("tutor", (query) => {
				query.preload("profession");
			})
			.firstOrFail();

		return {
			...tutor.toJSON(),
			firstName: tutor.name.split(" ").at(0),
			address: [tutor.tutor?.street, tutor.tutor?.number]
				.filter(Boolean)
				.join(", "),
			district: tutor.tutor.district,
			city: tutor.tutor.city,
			state: tutor.tutor.state,
			postalCode: tutor.tutor.postalCode,
			document: tutor.tutor.document,
			cellphone: tutor.tutor.cellphone,
			email: tutor.tutor.email,

			inscription: tutor.tutor.inscription,
			nationality: tutor.tutor.nationality,
			civilStatus: tutor.tutor.civilStatus,
			profession_description: tutor.tutor.profession?.description,
		};
	}

	async fetchPatient(id: string) {
		const patient = await Patient.query()
			.where("id", id)
			.preload("patientAnimal", (query) => {
				query.preload("hair");
				query.preload("race", (query) => {
					query.preload("specie");
				});
			})
			.firstOrFail();

		const calculateGender = (data: Patient) => {
			if (!data.gender) {
				return "não informado";
			}

			return data.gender === PatientGender.MALE ? "macho" : "fêmea";
		};

		const calculateVaccine = (data: PatientVaccineOrigin) => {
			if (data === PatientVaccineOrigin.C) {
				return "Própria clinica";
			}

			if (data === PatientVaccineOrigin.F) {
				return "Fora da clinica";
			}

			return "Não vacinado";
		};

		return {
			...patient.toJSON(),
			...patient.patientAnimal?.toJSON(),
			gender: calculateGender(patient),
			hair: patient.patientAnimal?.hair?.description,
			race: patient.patientAnimal?.race?.description,
			specie: patient.patientAnimal?.race?.specie?.description,
			vaccinated: calculateVaccine(patient.vaccineOrigin),
			numeric_age: patient.birthDate
				? differenceInYears(new Date(), patient.birthDate)
				: null,
			birthDate: patient.birthDate
				? format(patient.birthDate, "dd/MM/yyyy", {
						locale: Locales.ptBR,
					})
				: null,
			castrated: patient.patientAnimal?.castrated ? "Esterelizado" : "Fértil",
			microchip: patient.patientAnimal?.microchip,
		};
	}

	async fetchBillContracts(id: string): Promise<string[]> {
		const bill = await Bill.findOrFail(id);

		const rows = await Database.from("bill_payments")
			.select(
				Database.raw(`'0-bill' as ref,
              case
           when bill_payments.qty_installments = 1 and payment_methods.tef = 'NAO' then format('R$ \%s em \%s x em \%s - \%s',
                                                                                  bill_payments.total_value,
                                                                                  bill_payments.qty_installments,
                                                                                  payment_methods.description,
                                                                                  bill_payments.expiration_date::date)
           when bill_payments.qty_installments > 1 and payment_methods.tef <> 'NAO' then format('R$ \%s em \%s x em \%s - \%s',
                                                                                   bill_payments.total_value *
                                                                                   bill_payments.qty_installments,
                                                                                   bill_payments.qty_installments,
                                                                                   payment_methods.description,
                                                                                   bill_payments.created_at::date)
           else format('R$ \%s em \%s x em \%s - \%s', bill_payments.total_value, bill_payments.qty_installments,
                       payment_methods.description,
                       bill_payments.created_at::date) end as pgto
              `),
			)
			.joinRaw(
				"join payment_methods on bill_payments.payment_method_id = payment_methods.id",
			)
			.where("bill_payments.bill_id", id)
			.whereNull("bill_payments.deleted_at")
			.groupBy("pgto")
			.union((qb) => {
				qb.from("bills")
					.select(
						Database.raw(`
			       '1-bill_pend'  as ref,
			       format('R$ %s - Pendente de definição da forma de pagamento ', bills.total_value - bills.paid_value) as pgto
			    `),
					)
					.whereRaw(
						"bills.id = ? and bills.paid_value < bills.total_value and bills.budget_id is null",
						[id],
					);
			})
			.union((qb) => {
				qb.from("budget_payments")
					.select(
						Database.raw(`
			           '2-bud_prom'                        as ref,
			           format('R$ %s em %s x em %s - Pendende de pagamento', budget_payments.total_value, budget_payments.installments,
			           payment_methods.description) as pgto
			    `),
					)
					.joinRaw(
						"join payment_methods on budget_payments.payment_method_id = payment_methods.id",
					)
					.whereRaw(
						"budget_payments.budget_id = ? and budget_payments.deleted_at is null and confirmation_date is null",
						[bill.budget_id ?? v4()],
					);
			})

			.union((qb) => {
				qb.from("budgets")
					.select(
						Database.raw(`
			           '3-bud_pend'                                                                                             as ref,
			           format('R$ %s - Pendente de definição da forma de pagamento ', budgets.total_value - budgets.paid_value) as pgto
			           `),
					)
					.whereRaw(
						"budgets.id = ? and budgets.paid_value < budgets.total_value",
						[bill.budget_id ?? v4()],
					);
			})
			.orderByRaw("1, 2");

		return rows.map((r) => r.pgto);
	}

	async fetchUnit(id: string) {
		const model = await BusinessUnit.query().where("id", id).firstOrFail();

		return {
			...model.toJSON(),
			fantasyName: model.fantasyName,
			companyName: model.companyName,
			postalCode: model.postalCode,
		};
	}

	async fetchContractor(billID: string) {
		const model = await Bill.query().where("id", billID).firstOrFail();
		if (!model.financial_responsible_id) {
			return {};
		}

		return this.fetchTutor(model.financial_responsible_id);
	}

	async fetchUser(id: string, unitId: string | undefined) {
		const model = await User.query().where("id", id).firstOrFail();
		const related = {
			...model.toJSON(),
			treatment: "Dr(a).",
		} as unknown as User & { role?: string };

		if (unitId) {
			const userRole = await model
				.related("roles")
				.query()
				.where("unit_id", unitId)
				.preload("role")
				.first();
			related.role = userRole?.role?.name;
		}

		return related;
	}

	private snakeToCamelCase(value: string) {
		return value.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
	}
}
