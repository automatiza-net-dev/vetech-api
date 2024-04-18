import { inject } from "@adonisjs/fold";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Drive from "@ioc:Adonis/Core/Drive";
import Logger from "@ioc:Adonis/Core/Logger";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Bill, { BillStatus } from "App/Models/Bill";
import Budget, { BudgetStatus } from "App/Models/Budget";
import BusinessUnit from "App/Models/BusinessUnit";
import EconomicGroup from "App/Models/EconomicGroup";
import Hospitalization, {
	HospitalizationType,
} from "App/Models/Hospitalization";
import Patient, { PatientGender, PatientType } from "App/Models/Patient";
import TimelineType from "App/Models/TimelineType";
import User from "App/Models/User";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import HospitalizationTimeline from "App/Models/mongoose/HospitalizationTimeline";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IAssignPatientTutor from "Contracts/interfaces/IAssignPatientTutor";
import IPatientData, {
	IFastStorePatient,
} from "Contracts/interfaces/IPatientData";
import IPatientSupplierData from "Contracts/interfaces/IPatientSupplierData";
import IPatientTutorData from "Contracts/interfaces/IPatientTutorData";
import ISearchPatient from "Contracts/interfaces/ISearchPatient";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import { HospitalizationStatus } from "../Models/Hospitalization";

interface ISearch {
	name?: string;
	gender?: PatientGender;
	type?: PatientType;
}

interface ISearchAnimals {
	name?: string;
	tutor?: string;
	race?: string;
	specie?: string;
	document?: string;
	phone?: string;
	tag?: string;
}

interface ISearchTutor {
	name?: string;
	document?: string;
	phone?: string;
	patient?: string;
	race?: string;
	tutorId?: string;
	patientId?: string;
}

interface ISearchSupplier {
	name?: string;
	document?: string;
}

@inject()
export default class PatientService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(unitId: string, data: ISearch): Promise<Array<Patient>> {
		const group = await this.getEconomicGroup(unitId);

		const qb = group.related("patients").query();

		if (data.name) {
			qb.whereRaw("name ilike ?", [`%${data.name!.replaceAll(" ", "%")}%`]);
		}

		if (data.gender) {
			qb.where("gender", data.gender);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		return qb;
	}

	public async nonPets(unitId: string) {
		const group = await this.getEconomicGroup(unitId);

		const qb = group
			.related("patients")
			.query()
			.whereIn("type", [PatientType.TUTOR, PatientType.SUPPLIER])
			.preload("tutor");

		return qb;
	}

	public async reducedTutorsIndex(unitId: string, data: ISearchTutor) {
		const group = await this.getEconomicGroup(unitId);

		const qb = group
			.related("patients")
			.query()
			.where("type", PatientType.TUTOR)
			.preload("tutor", (query) => {
				query.preload("clientOrigin");
				query.preload("profession");

				if (data.document) {
					query.where("document", "ilike", `%${data.document}%`);
				}

				if (data.phone) {
					query.where("cellphone", "ilike", `%${data.phone}%`);
				}
			})
			.preload("dependents", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.whereILike("description", `%${data.race ?? ""}`);
					});
				});
			});

		if (data.name) {
			qb.whereRaw("name ilike ?", [`%${data.name!.replaceAll(" ", "%")}%`]);
		}

		if (data.patient) {
			qb.whereHas("dependents", () => {
				qb.whereRaw("name ilike ?", [
					`%${data.patient!.replaceAll(" ", "%")}%`,
				]);
			});
		}

		const result = await qb;

		return result
			.filter((model) => {
				if (data.document && !model.tutor) {
					return false;
				}
				if (data.phone && !model.tutor) {
					return false;
				}

				if (data.race && !model.patientAnimal.race) {
					return false;
				}

				return true;
			})
			.map((elem) => ({
				id: elem.id,
				name: elem.name,
				email: elem.tutor.email,
				tag: elem.tag,
				cellphone: elem.tutor.cellphone,
				createdAt: elem.createdAt,
				dependents: elem.dependents.map((patient) => ({
					id: patient.id,
					name: patient.name,
					tag: patient.tag,
					race: this.sharedService.captureGroup(
						patient?.patientAnimal?.race,
						(v) => ({
							id: v.id,
							description: v.description,
						}),
					),
				})),
			}));
	}

	public async tutorsIndex(unitId: string, data: ISearchTutor) {
		const group = await this.getEconomicGroup(unitId);

		const qb = group
			.related("patients")
			.query()
			.orderBy("name", "asc")
			.where("type", PatientType.TUTOR)
			.preload("tutor", (query) => {
				query.preload("clientOrigin");
				query.preload("profession");

				if (data.document) {
					query.where("document", "ilike", `%${data.document}%`);
				}
			})
			.preload("dependents", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.whereILike("description", `%${data.race ?? ""}`);
					});
				});
			});

		if (data.phone) {
			qb.whereHas("contacts", (query) => {
				query.whereRaw(
					`patient_contacts.type <> 'email'
  and (
    case
        when length(patient_contacts.contact) = 10 and length(?) = 11 then
            SUBSTRING(patient_contacts.contact, 1, 2) || '9' || SUBSTRING(patient_contacts.contact, 3, 8) ilike
            ? -- add o 9
        when length(patient_contacts.contact) = 11 and length(?) = 10 then patient_contacts.contact ilike
                                                                           '%' ||
                                                                           SUBSTRING(?, 1, 2) ||
                                                                           '9' ||
                                                                           SUBSTRING(?, 3, 8) ||
                                                                           '%' -- add o 9
        else patient_contacts.contact ilike ? end
    )`,
					[
						data.phone ?? "",
						`%${data.phone ?? ""}%`,
						data.phone ?? "",
						data.phone ?? "",
						data.phone ?? "",
						`%${data.phone ?? ""}%`,
					],
				);
			});
		}

		if (data.tutorId) {
			qb.where("patients.id", data.tutorId);
		}

		if (data.name) {
			qb.whereRaw("name ilike ?", [`%${data.name.replaceAll(" ", "%")}%`]);
		}

		if (data.patient || data.patientId) {
			qb.whereHas("dependents", (query) => {
				if (data.patient) {
					query.whereRaw("name ilike ?", [
						`%${data.patient!.replaceAll(" ", "%")}%`,
					]);
				}

				if (data.patientId) {
					query.where("holder_dependents.dependent_id", data.patientId);
				}
			});
		}

		const result = await qb;

		return result
			.filter((model) => {
				if (data.document && !model.tutor) {
					return false;
				}
				if (data.phone && !model.tutor) {
					return false;
				}

				if (data.race && !model.patientAnimal.race) {
					return false;
				}

				return true;
			})
			.map((elem) => ({
				id: elem.id,
				name: elem.name,
				email: elem.tutor.email,
				document: elem.tutor.document,
				inscription: elem.tutor.inscription,
				tag: elem.tag,
				cellphone: elem.tutor.cellphone,
				diabetes: elem.diabetes,
				hypertension: elem.hypertension,
				profession: elem.tutor.profession,
				civilStatus: elem.tutor.civilStatus,
				nationality: elem.tutor.nationality,
				clientOriginItemDescription: elem.clientOriginItemDescription,
				createdAt: elem.createdAt,
				clientOrigin: this.sharedService.captureGroup(
					elem.tutor?.clientOrigin,
					(v) => ({
						id: v.id,
						description: v.description,
					}),
				),
				address: {
					street: elem.tutor.street,
					number: elem.tutor.number,
					complement: elem.tutor.complement,
					district: elem.tutor.district,
					city: elem.tutor.city,
					state: elem.tutor.state,
				},
				dependents: elem.dependents.map((patient) => ({
					id: patient.id,
					name: patient.name,
					tag: patient.tag,
					gender: patient.gender,
					birthDate: patient.birthDate,
					race: patient?.patientAnimal?.race
						? {
								id: patient.patientAnimal.race.id,
								description: patient.patientAnimal.race.description,
							}
						: null,
				})),
			}));
	}

	public async supplierIndex(unitId: string, data: ISearchSupplier) {
		const group = await this.getEconomicGroup(unitId);

		const qb = group
			.related("patients")
			.query()
			.where("type", PatientType.SUPPLIER)
			.whereHas("tutor", (query) => {
				if (data.document) {
					query.where("document", "ilike", `%${data.document}%`);
					query.where("inscription", "ilike", `%${data.document}%`);
				}
			})
			.preload("tutor", (query) => {
				query.preload("accountPlan");
			});

		if (data.name) {
			qb.whereRaw("name ilike ?", [`%${data.name!.replaceAll(" ", "%")}%`]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			corporateName: elem.tutor.corporateName,
			name: elem.name,
			email: elem.tutor.email,
			document: elem.tutor.document,
			tag: elem.tag,
			telephone: elem.tutor.telephone,
			cellphone: elem.tutor.cellphone,
			accountPlan: this.sharedService.captureGroup(
				elem.tutor.accountPlan,
				(v) => ({
					id: v.id,
					description: v.description,
				}),
			),
		}));
	}

	public async animalsIndex(unitId: string, data: ISearchAnimals) {
		const group = await this.getEconomicGroup(unitId);

		const qb = group
			.related("patients")
			.query()
			.orderBy("name", "asc")
			.where("type", PatientType.ANIMAL);

		if (data.tag) {
			qb.where("tag", "ilike", `%${data.tag}%`);
		}

		if (data.race) {
			qb.whereHas("patientAnimal", (query) => {
				query.whereHas("race", (subquery) => {
					subquery.whereILike("description", `%${data.race ?? ""}%`);
				});
			});
		}

		if (data.tutor) {
			qb.whereHas("tutors", (q) => {
				q.whereRaw("name ilike ?", [`%${data.tutor!.replaceAll(" ", "%")}%`]);
			});
		}

		if (data.phone) {
			const clearPhone = data.phone.replace(/\D/g, "");

			qb.whereRaw(
				`patients.id in (select holder_dependents.dependent_id
             from "patient_contacts"
                      join holder_dependents
                           on patients.id = holder_dependents.dependent_id and
                              patient_contacts.patient_id = holder_dependents.holder_id
             where (patient_contacts.type <> 'email'
                 and (
                        case
                            when length(patient_contacts.contact) = 10 and length(?) = 11 then
                                regexp_replace(SUBSTRING(patient_contacts.contact, 1, 2) || '9' ||
                                               SUBSTRING(patient_contacts.contact, 3, 8), 'D', '', 'g') ilike
                                ? -- add o 9
                            when length(patient_contacts.contact) = 11 and length(?) = 10 then
                                regexp_replace(patient_contacts.contact, 'D', '', 'g') ilike
                                '%' || SUBSTRING(?, 1, 2) || '9' || SUBSTRING(?, 3, 8) || '%' -- add o 9
                            else regexp_replace(patient_contacts.contact, 'D', '', 'g') ilike ? end
                        )))`,
				[
					clearPhone,
					`%${clearPhone}%`,
					clearPhone,
					clearPhone,
					clearPhone,
					`%${clearPhone}%`,
				],
			);
		}

		qb.preload("tutors", (query) => {
			query
				.preload("tutor", (query) => {
					query.preload("clientOrigin");
				})
				.pivotColumns(["is_main"]);
		});

		qb.preload("patientAnimal", (query) => {
			query.preload("race", (q) => {
				q.preload("specie");
			});
			query.preload("hair");
		});

		if (data.name) {
			qb.whereRaw("name ilike ?", [`%${data.name.replaceAll(" ", "%")}%`]);
		}

		const result = await qb;

		return result
			.filter((r) => {
				if (data.document) {
					const matches = r.tutors.some((t) =>
						t.tutor.document?.includes(data.document?.replace(/\D/g, "") ?? ""),
					);

					if (!matches) {
						return false;
					}
				}

				// if (data.phone) {
				// 	const matches = r.tutors.some((t) =>
				// 		t.tutor.cellphone?.includes(data.phone ?? ""),
				// 	);
				//
				// 	if (!matches) {
				// 		return false;
				// 	}
				// }

				if (data.specie) {
					const matches = r.patientAnimal?.race?.specie.description
						.toLocaleLowerCase()
						.includes(data.specie.toLowerCase());

					if (!matches) {
						return false;
					}
				}

				return true;
			})
			.map((patient) => {
				return {
					id: patient.id,
					name: patient.name,
					tag: patient.tag,
					gender: patient.gender,
					birthDate: patient.birthDate,
					castrated: patient.patientAnimal?.castrated,
					weight: patient.weight,
					race: patient.patientAnimal?.race,
					tutors: patient.tutors.map((elem) => ({
						id: elem.id,
						name: elem.name,
						email: elem.tutor?.email ?? "-",
						tag: elem.tag,
						cellphone: elem.tutor?.cellphone ?? "-",
						isMain: elem.$extras.pivot_is_main,
					})),
				};
			});
	}

	public async uniqueOrigins(authCtx: AuthContext) {
		const rows = await Database.from("patients")
			.select(
				Database.raw(
					`distinct(patients.client_origin_item_description) as desc`,
				),
			)
			.joinRaw(
				`left join patient_economic_groups on patient_economic_groups.patient_id = patients.id`,
			)
			.where("patient_economic_groups.economic_group_id", authCtx.group.id)
			.whereNotNull("patients.client_origin_item_description")
			.whereNull("patients.deleted_at")
			.orderBy("patients.client_origin_item_description");

		return rows.map((r) => r.desc);
	}

	public async search(unitId: string, data: ISearchPatient) {
		const group = await this.getEconomicGroup(unitId);

		const tutors = await group
			.related("patients")
			.query()
			.where("type", PatientType.TUTOR)
			.andWhereILike("name", `%${data.tutor ?? ""}%`)
			.preload("dependents", (query) => {
				query.whereILike("name", `%${data.patient ?? ""}%`);
			})
			.select(["id"]);

		return tutors.flatMap((t) => t.dependents);
	}

	public async tutorNonPatients(unitId: string, id: string) {
		const tutor = await Patient.query()
			.where("id", id)
			.preload("dependents")
			.first();

		if (!tutor) {
			throw new ResourceNotFoundException(
				"Tutor não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		const animalsIndex = await this.animalsIndex(unitId, {});

		const dependents = tutor.dependents.map((d) => d.id);

		return animalsIndex.filter(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			(f) => !dependents.includes((f as unknown as Patient).id!),
		);
	}

	public async show(unitId: string, patientId: string) {
		const group = await this.getEconomicGroup(unitId);

		const patient = await group
			.related("patients")
			.query()
			.where("patient_id", patientId)
			.first();

		if (!patient) {
			throw new ResourceNotFoundException(
				"Paciente não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (patient.type === PatientType.ANIMAL) {
			const tutors = await patient
				.related("tutors")
				.query()
				.pivotColumns(["is_main"])
				.preload("tutor", (query) => {
					query.select(["id", "cellphone", "telephone", "email"]);
				});

			await patient.load("patientAnimal", (query) => {
				query.preload("race", (query) => {
					query.preload("specie");
				});
				query.preload("hair");
			});

			const mapped = tutors.map((t) => {
				return { ...t.toJSON(), is_main: Boolean(t.$extras.pivot_is_main) };
			});

			return { ...patient.toJSON(), tutors: mapped };
		}

		if (patient.type === PatientType.TUTOR) {
			await patient.load("tutor", (query) => {
				query.preload("clientOrigin");
				query.preload("profession");
			});
			await patient.load("dependents");
			await patient.load("contacts");
		}

		if (patient.type === PatientType.SUPPLIER) {
			await patient.load("tutor", (query) => {
				query.preload("accountPlan");
			});
		}

		return patient;
	}

	public async metadata(authCtx: AuthContext, patientId: string) {
		const key = authCtx.system.name === "LiftOne" ? "client_id" : "patient_id";

		const patient = await authCtx.group
			.related("patients")
			.query()
			.where("patient_id", patientId)
			.first();

		if (!patient) {
			throw new ResourceNotFoundException(
				"Paciente não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		const sales = await Bill.query()
			.where(key, patient.id)
			.where("status", BillStatus.A);

		let total_sum = 0;
		let paid_sum = 0;

		sales.forEach((sale) => {
			total_sum += sale.totalValue;
			paid_sum += sale.paidValue;
		});

		return {
			missingFromBills: total_sum - paid_sum,
		};
	}

	public async salesMetadata(authCtx: AuthContext, patientId: string) {
		const key = authCtx.system.name === "LiftOne" ? "client_id" : "patient_id";

		const patient = await authCtx.group
			.related("patients")
			.query()
			.where("patient_id", patientId)
			.first();

		if (!patient) {
			throw new ResourceNotFoundException(
				"Paciente não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		const sales = await Bill.query()
			.where(key, patient.id)
			.preload("payments")
			.preload("seller")
			.preload(key === "patient_id" ? "client" : "user")
			.orderByRaw(`bill_date desc, tag desc`);

		const budgets = await Budget.query()
			.where(key, patient.id)
			.where("status", BudgetStatus.A)
			.preload("seller")
			.preload(key === "patient_id" ? "client" : "user")
			.orderByRaw(`budget_date desc, tag desc`);

		const result: Array<unknown> = [];

		sales.forEach((sale) => {
			const getStrStatus = (s: Bill) => {
				if (s.status === BillStatus.A) {
					return "Venda em Aberto";
				}

				if (s.status === BillStatus.B) {
					return "Venda Finalizada";
				}

				if (s.status === BillStatus.E) {
					return "Venda Extornada";
				}

				return "Venda Excluída";
			};

			result.push({
				id: sale.id,
				_type: "sale" as const,
				tag: sale.tag,
				date: sale.billDate,
				seller: sale.seller.name,
				client: key === "patient_id" ? sale.client?.name : sale.user?.name,
				total_value: sale.totalValue,
				missing_value:
					sale.totalValue -
					sale.payments.reduce((acc, curr) => acc + curr.totalValue, 0),
				status: getStrStatus(sale),
			});
		});

		budgets.forEach((item) => {
			result.push({
				id: item.id,
				_type: "budget" as const,
				tag: item.tag,
				date: item.budgetDate,
				seller: item.seller ? item.seller.name : authCtx.user.name,
				client: key === "patient_id" ? item.client?.name : item.user?.name,
				total_value: item.totalValue,
				missing_value: null,
				status: "Orçamento em aberto",
			});
		});

		return result.sort(
			(
				a: { date: DateTime; tag: string },
				b: { date: DateTime; tag: string },
			) => {
				if (a.date.diff(b.date).milliseconds > 0) {
					return -1;
				}

				if (a.date.diff(b.date).milliseconds < 0) {
					return 1;
				}

				return a.tag.localeCompare(b.tag);
			},
		);
	}

	public async fastStore(unitId: string, data: IFastStorePatient) {
		const group = await this.getEconomicGroup(unitId);

		const client = Database.connection();
		return Database.transaction(async (trx) => {
			const tutors = await group
				.related("patients")
				.query()
				.useTransaction(trx)
				.where("type", PatientType.TUTOR)
				.select("id");

			const patients = await group
				.related("patients")
				.query()
				.useTransaction(trx)
				.where("type", PatientType.ANIMAL)
				.select("id");

			const tutor = await Patient.create(
				{
					name: data.tutorName ?? `Não informado - ${data.tutorPhone}`,
					type: PatientType.TUTOR,
					tag: (tutors.length + 1).toString(),
				},
				{ client: trx },
			);
			let patient: Patient | null = null;

			await tutor.related("tutor").create({
				email: data.tutorEmail,
				cellphone: data.tutorPhone,
				client_origin_id: data.tutorOriginId,
			});

			await tutor.related("contacts").create(
				{
					main: true,
					contact: data.tutorPhone,
					observation: "Contato principal",
					type: "celular",
				},
				{ client: trx },
			);

			await group.related("patients").attach([tutor.id], trx);

			if (data.patientName || data.patientRaceId || data.patientGender) {
				patient = await Patient.create(
					{
						name: data.patientName,
						gender: data.patientGender,
						type: PatientType.ANIMAL,
						tag: (patients.length + 1).toString(),
					},
					{
						client: trx,
					},
				);

				await tutor.related("dependents").attach([patient.id], trx);
				await group.related("patients").attach([patient.id], trx);
				await patient.related("patientAnimal").create(
					{
						race_id: data.patientRaceId,
					},
					trx,
				);

				await client
					.from("holder_dependents")
					.where("dependent_id", patient.id)
					.where("holder_id", tutor.id)
					.update({ is_main: true })
					.useTransaction(trx);
			}

			return {
				tutor,
				patient,
			};
		});
	}

	public async store(
		unitId: string,
		data: Omit<IPatientData, "active">,
	): Promise<Patient> {
		const group = await this.getEconomicGroup(unitId);

		const trx = await Database.transaction();

		try {
			const patients = await group
				.related("patients")
				.query()
				.where("type", PatientType.ANIMAL)
				.select("id");

			const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

			const patient = await Patient.create(
				{
					name: data.name,
					gender: data.gender,
					tags: data.tags,
					birthDate: data.birthDate?.toJSDate(),
					type: PatientType.ANIMAL,
					photo,
					vaccineOrigin: data.vaccineOrigin,
					tag: (patients.length + 1).toString(),
					hypertension: data.hypertension,
					diabetes: data.diabetes,
					glycemia: data.glycemia,
					pressure: data.pressure,
				},
				{
					client: trx,
				},
			);

			if (data.holderId) {
				const holder = await Patient.findOrFail(data.holderId, {
					client: trx,
				});

				if (holder.type !== PatientType.TUTOR) {
					throw new BadRequestException("Tutor inválido", 400, "E_BAD_REQUEST");
				}
				await holder.related("dependents").attach([patient.id], trx);
			}

			await group.related("patients").attach([patient.id], trx);

			await patient.related("patientAnimal").create(
				{
					race_id: data.raceId,
					hair_id: data.hairId,
					microchip: data.microchip,
					castrated: data.castrated,
				},
				trx,
			);

			await trx.commit();

			return patient;
		} catch (e) {
			Logger.error(e.message);
			await trx.rollback();

			throw new InternalErrorException(
				"Erro na execução",
				500,
				"E_INTERNAL_ERROR",
			);
		}
	}

	public async storeTutor(
		authCtx: AuthContext,
		data: Omit<IPatientTutorData, "active">,
	): Promise<Patient> {
		return Database.transaction(async (trx) => {
			if (data.document && authCtx.unit.unitConfig.requiresClientDocument) {
				if (!this.sharedService.validDocument(data.document)) {
					throw new BadRequestException(
						"Documento inválido",
						400,
						"E_INVALID_DOCUMENT",
					);
				}

				const document = await authCtx.group
					.related("patients")
					.query()
					.useTransaction(trx)
					.whereHas("tutor", (query) => {
						query.where("document", data.document?.replace(/\D/g, "") ?? "");
					})
					.first();
				if (document) {
					throw new BadRequestException(
						`Este Cpf/Cnpj já existe neste Grupo Economico para o Tutor "${data.name}"`,
						400,
						"E_DOCUMENT_ALREADY_REGISTERED",
					);
				}
			}

			const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

			const tutors = await authCtx.group
				.related("patients")
				.query()
				.where("type", PatientType.TUTOR)
				.select("id");

			const patient = await Patient.create(
				{
					name: data.name,
					birthDate: data.birthDate?.toJSDate(),
					gender: data.gender,
					tags: data.tags,
					photo,
					type: PatientType.TUTOR,
					diabetes: data.diabetes,
					hypertension: data.hypertension,
					tag: (tutors.length + 1).toString(),
					clientOriginItemDescription: data.clientOriginItemDescription,
				},
				{ client: trx },
			);

			await patient.related("tutor").create(
				{
					residence: data.residence,
					document: data.document?.replace(/\D/g, ""),
					inscription: data.inscription,
					corporateName: data.corporate_name,
					email: data.email,
					cellphone: data.cellphone,
					telephone: data.telephone,
					messagePersonName: data.message_person_name,
					messagePersonPhone: data.message_person_phone,
					postalCode: data.postalCode,
					street: data.street,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state,
					client_origin_id: data.clientOriginId,
					cityCode: data.cityCode,

					civilStatus: data.civilStatus,
					nationality: data.nationality,
					profession_id: data.professionId,
				},
				{
					client: trx,
				},
			);

			await authCtx.group.related("patients").attach([patient.id], trx);

			if (data.cellphone) {
				await patient.related("contacts").create(
					{
						main: true,
						contact: data.cellphone,
						observation: "Contato principal",
						type: "celular",
					},
					{ client: trx },
				);
			}

			return patient;
		});
	}

	public async assignPatientTutor(_: string, data: IAssignPatientTutor) {
		const tutor = await Patient.query()
			.where("id", data.holder)
			.where("type", PatientType.TUTOR)
			.preload("dependents")
			.first();

		if (!tutor) {
			throw new BadRequestException("Tutor inválido", 400, "E_BAD_REQUEST");
		}

		const dependents = tutor.dependents.map((d) => d.id);
		const updatedDependents = Array.from(
			new Set([...dependents, data.patient]),
		);

		await tutor.related("dependents").sync(updatedDependents);
	}

	public async storeSupplier(
		unitId: string,
		data: Omit<IPatientSupplierData, "active">,
	): Promise<Patient> {
		const group = await this.getEconomicGroup(unitId);

		return Database.transaction(async (trx) => {
			if (data.document) {
				// if (!this.sharedService.validDocument(data.document)) {
				// 	throw new BadRequestException(
				// 		"Documento inválido",
				// 		400,
				// 		"E_INVALID_DOCUMENT",
				// 	);
				// }

				const document = await group
					.related("patients")
					.query()
					.useTransaction(trx)
					.whereHas("tutor", (query) => {
						query.where("document", data.document?.replace(/\D/g, "") ?? "");
					})
					.first();
				if (document) {
					throw new BadRequestException(
						`Este Cpf/Cnpj já existe neste Grupo Economico para o Fornecedor "${data.name}"`,
						400,
						"E_DOCUMENT_ALREADY_REGISTERED",
					);
				}
			}

			const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

			const supplier = await group
				.related("patients")
				.query()
				.useTransaction(trx)
				.where("type", PatientType.SUPPLIER)
				.select("id");

			const patient = await Patient.create(
				{
					name: data.name,
					tags: data.tags,
					photo,
					type: PatientType.SUPPLIER,
					tag: (supplier.length + 1).toString(),
					birthDate: data.birthDate?.toJSDate(),
				},
				{ client: trx },
			);

			await patient.related("tutor").create({
				account_plan_id: data.accountPlanId,

				residence: data.residence,
				document: data.document?.replace(/\D/g, ""),
				inscription: data.inscription,
				corporateName: data.corporateName,
				email: data.email,
				cellphone: data.cellphone,
				telephone: data.telephone,
				messagePersonName: data.messagePersonName,
				messagePersonPhone: data.messagePersonPhone,
				postalCode: data.postalCode,
				street: data.street,
				number: data.number,
				complement: data.complement,
				district: data.district,
				city: data.city,
				state: data.state,
				cityCode: data.cityCode,
			});

			await group.related("patients").attach([patient.id], trx);

			return patient;
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: Omit<IPatientData, "holderId"> & {
			death: boolean;
			deathDate?: DateTime;
			technicianId?: string;
			deathObservation?: string;
		},
	): Promise<Patient> {
		return Database.transaction(async (trx) => {
			const patient = await authCtx.group
				.related("patients")
				.query()
				.useTransaction(trx)
				.where("patient_id", id)
				.preload("patientAnimal")
				.first();

			if (!patient) {
				throw new ResourceNotFoundException(
					"Paciente não encontrado",
					404,
					"E_NOT_FOUND",
				);
			}

			if (!patient?.patientAnimal.death && data.death) {
				await this.$declareDeath(trx, authCtx, patient, {
					deathDate: data.deathDate ?? DateTime.now(),
					technicianId: data.technicianId ?? authCtx.user.id,
					deathObservation: data.deathObservation ?? "Não informado",
				});
			}

			const photo = data.photo
				? await this.uploadPhoto(data.photo)
				: patient.photo;

			await patient
				.merge({
					name: data.name,
					photo,
					gender: data.gender,
					tags: data.tags,
					birthDate: data.birthDate?.toJSDate(),
					active: data.active,
					vaccineOrigin: data.vaccineOrigin,
					hypertension: data.hypertension,
					diabetes: data.diabetes,
					glycemia: data.glycemia,
					pressure: data.pressure,
				})
				.useTransaction(trx)
				.save();

			if (patient.patientAnimal) {
				await patient.patientAnimal
					.merge({
						race_id: data.raceId,
						hair_id: data.hairId,
						microchip: data.microchip,
						castrated: data.castrated,
						death: data.death,
						deathDate: data.deathDate,
					})
					.useTransaction(trx)
					.save();
			}

			return patient;
		});
	}

	public async declareDeath(
		authCtx: AuthContext,
		id: string,
		data: {
			deathDate: DateTime;
			technicianId: string;
			deathObservation: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const patient = await authCtx.group
				.related("patients")
				.query()
				.useTransaction(trx)
				.where("patient_id", id)
				.where("type", PatientType.ANIMAL)
				.preload("patientAnimal")
				.first();

			if (!patient) {
				throw new ResourceNotFoundException(
					"Paciente não encontrado",
					404,
					"E_NOT_FOUND",
				);
			}

			if (patient.patientAnimal.death) {
				throw new BadRequestException(
					"Paciente já declarado como morto",
					400,
					"E_BAD_REQUEST",
				);
			}

			await this.$declareDeath(trx, authCtx, patient, data);
		});
	}

	private async $declareDeath(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		patient: Patient,
		data: {
			deathDate: DateTime;
			technicianId: string;
			deathObservation: string;
		},
	) {
		await patient.patientAnimal
			.merge({
				death: true,
				deathDate: DateTime.now(),
			})
			.useTransaction(trx)
			.save();

		const technician = await User.findOrFail(data.technicianId);

		const hospitalization = await Hospitalization.query()
			.useTransaction(trx)
			.where("patient_id", patient.id)
			.where("status", HospitalizationStatus.ACTIVE)
			.limit(1)
			.first();

		if (hospitalization) {
			await HospitalizationTimeline.create({
				meta: {
					hospitalization: hospitalization.id,
					group: authCtx.group.id,
					unit: authCtx.unit.id,
					origin: "death_occurrence",
				},
				data: {
					type: HospitalizationType[hospitalization.type],
					hospitalizedAt: hospitalization.createdAt,
					realizedAt: DateTime.now(),
					observation: "-",
					issuedAt: DateTime.now(),
					technician: {
						id: technician.id,
						name: technician.name,
					},
					attachments: [],
				},
			});

			await HospitalizationTimeline.updateMany(
				{
					"meta.hospitalization": hospitalization.id,
					"meta.type": "begin_hospitalization",
				},
				{
					$set: {
						"data.deathAt": DateTime.now(),
					},
				},
			);
		} else {
			const timelineInfo = await TimelineType.firstOrCreate(
				{
					description: "Atendimento",
					system_id: authCtx.system.id,
				},
				{
					color: "#000000",
					description: "Atendimento",
					system_id: authCtx.system.id,
					requiresObservation: false,
				},
			);

			await AnimalTimeline.create({
				timeline_id: timelineInfo.id,
				timeline_type: {
					description: timelineInfo.description,
					color: timelineInfo.color,
					requires_observation: timelineInfo.requiresObservation,
				},
				timeline_info: {
					tag: patient.id,
					event: "OBITO",
					realized: DateTime.now(),
					resume: "Óbito",
					description: "-",
					technician: {
						id: technician.id,
						name: technician.name,
					},
				},
			});
		}
	}

	public async updateTutor(
		authCtx: AuthContext,
		id: string,
		data: IPatientTutorData,
	): Promise<Patient> {
		return Database.transaction(async (trx) => {
			const tutor = await Patient.query()
				.useTransaction(trx)
				.where("id", id)
				.where("type", PatientType.TUTOR)
				.preload("tutor")
				.first();

			if (!tutor) {
				throw new BadRequestException("Tutor inválido", 400, "E_BAD_REQUEST");
			}

			if (
				data.document &&
				data.document !== tutor.tutor.document &&
				authCtx.unit.unitConfig.requiresClientDocument
			) {
				if (!this.sharedService.validDocument(data.document)) {
					throw new BadRequestException(
						"Documento inválido",
						400,
						"E_INVALID_DOCUMENT",
					);
				}

				const document = await authCtx.group
					.related("patients")
					.query()
					.useTransaction(trx)
					.whereHas("tutor", (query) => {
						query.where("document", data.document?.replace(/\D/g, "") ?? "");
					})
					.whereNot("patient_id", tutor.id)
					.first();
				if (document) {
					throw new BadRequestException(
						`Este Cpf/Cnpj já existe neste Grupo Economico para o Tutor "${data.name}"`,
						400,
						"E_DOCUMENT_ALREADY_REGISTERED",
					);
				}
			}

			const photo = data.photo
				? await this.uploadPhoto(data.photo)
				: tutor.photo;

			await tutor.tutor
				.merge({
					residence: data.residence,
					document: data.document?.replace(/\D/g, ""),
					inscription: data.inscription,
					corporateName: data.corporate_name,
					email: data.email,
					cellphone: data.cellphone,
					telephone: data.telephone,
					messagePersonName: data.message_person_name,
					messagePersonPhone: data.message_person_phone,
					postalCode: data.postalCode,
					street: data.street,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state,
					client_origin_id: data.clientOriginId,
					cityCode: data.cityCode,
					civilStatus: data.civilStatus,
					nationality: data.nationality,
					profession_id: data.professionId,
				})
				.useTransaction(trx)
				.save();

			await tutor
				.merge({
					name: data.name,
					photo,
					gender: data.gender,
					tags: data.tags,
					birthDate: data.birthDate?.toJSDate(),
					active: data.active,
					diabetes: data.diabetes,
					hypertension: data.hypertension,
					clientOriginItemDescription: data.clientOriginItemDescription,
				})
				.useTransaction(trx)
				.save();

			return tutor;
		});
	}

	public async updateSupplier(
		unitId: string,
		id: string,
		data: IPatientSupplierData,
	): Promise<Patient> {
		const group = await this.getEconomicGroup(unitId);

		return Database.transaction(async (trx) => {
			const supplier = await Patient.query()
				.useTransaction(trx)
				.where("id", id)
				.where("type", PatientType.SUPPLIER)
				.preload("tutor")
				.first();

			if (!supplier) {
				throw new BadRequestException(
					"Fornecedor inválido",
					400,
					"E_BAD_REQUEST",
				);
			}

			if (data.document && data.document !== supplier.tutor.document) {
				// if (!this.sharedService.validDocument(data.document)) {
				// 	throw new BadRequestException(
				// 		"Documento inválido",
				// 		400,
				// 		"E_INVALID_DOCUMENT",
				// 	);
				// }

				const document = await group
					.related("patients")
					.query()
					.useTransaction(trx)
					.whereHas("tutor", (query) => {
						query.where("document", data.document?.replace(/\D/g, "") ?? "");
					})
					.first();
				if (document) {
					throw new BadRequestException(
						`Este Cpf/Cnpj já existe neste Grupo Economico para o Forcenedor "${data.name}"`,
						400,
						"E_DOCUMENT_ALREADY_REGISTERED",
					);
				}
			}

			const photo = data.photo
				? await this.uploadPhoto(data.photo)
				: supplier.photo;

			await supplier.tutor
				.merge({
					account_plan_id: data.accountPlanId,

					residence: data.residence,
					document: data.document?.replace(/\D/g, ""),
					inscription: data.inscription,
					corporateName: data.corporateName,
					email: data.email,
					cellphone: data.cellphone,
					telephone: data.telephone,
					messagePersonName: data.messagePersonName,
					messagePersonPhone: data.messagePersonPhone,
					postalCode: data.postalCode,
					street: data.street,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state,
					cityCode: data.cityCode,
				})
				.useTransaction(trx)
				.save();

			await supplier
				.merge({
					name: data.name,
					photo,
					tags: data.tags,
					active: data.active,
					birthDate: data.birthDate?.toJSDate(),
				})
				.useTransaction(trx)
				.save();

			return supplier;
		});
	}

	public async destroy(authCtx: AuthContext, patientId: string): Promise<void> {
		const patient = await Patient.query().where("id", patientId).first();

		if (!patient) {
			throw new BadRequestException("Paciente inválido", 400, "E_BAD_REQUEST");
		}

		let valid = false;

		const trx = await Database.transaction();

		try {
			await Database.from("holder_dependents")
				.delete()
				.where("holder_id", patientId)
				.orWhere("dependent_id", patientId)
				.useTransaction(trx);

			await Database.from("patient_tutors")
				.delete()
				.where("patient_id", patientId)
				.useTransaction(trx);

			await Database.from("patient_animals")
				.delete()
				.where("patient_id", patientId)
				.useTransaction(trx);

			await Database.from("patient_economic_groups")
				.delete()
				.where("patient_id", patientId)
				.useTransaction(trx);

			await Database.from("patients")
				.delete()
				.where("id", patientId)
				.useTransaction(trx);

			valid = true;
		} catch (e) {
			// console.log(e);
			// throw new Error(
			// 	"Failed, means that there is references to patient still",
			// );
			valid = false;
		}
		await trx.rollback();

		if (!valid) {
			throw new BadRequestException(
				"Este registro não pode ser excluido, somente pode ser inativado",
				400,
				"E_DANGLING",
			);
		}

		const groups = await patient.related("economicGroup").query();

		await patient.related("economicGroup").detach([authCtx.group.id]);

		if (groups.length > 1) {
			return;
		}

		await patient
			.merge({
				deletedAt: DateTime.now(),
				exclusion_user_id: authCtx.user.id,
			})
			.save();
	}

	public async setMainTutor(
		authCtx: AuthContext,
		patient: string,
		tutor: string,
	) {
		await Database.transaction(async (trx) => {
			const db_patient = await Patient.query()
				.useTransaction(trx)
				.where("id", patient)
				.where("type", PatientType.ANIMAL)
				.first();

			if (!db_patient) {
				throw new BadRequestException(
					"Paciente inválido",
					400,
					"E_BAD_REQUEST",
				);
			}

			const db_tutor = await Patient.query()
				.useTransaction(trx)
				.where("id", tutor)
				.where("type", PatientType.TUTOR)
				.first();

			if (!db_tutor) {
				throw new BadRequestException("Tutor inválido", 400, "E_BAD_REQUEST");
			}

			const patientTutors = await db_patient
				.related("tutors")
				.query()
				.useTransaction(trx)
				.pivotColumns(["is_main"])
				.where("dependent_id", patient);

			// console.log(patientTutors.map(t => t.$extras));
			const oldMainTutor = patientTutors.find(
				(t) => t.id !== tutor && t.$extras.pivot_is_main,
			);

			const client = Database.connection();

			const promises = patientTutors.map((t) => {
				return client
					.from("holder_dependents")
					.where("dependent_id", patient)
					.where("holder_id", t.id)
					.update({ is_main: t.id === tutor })
					.useTransaction(trx);
			});
			await Promise.all(promises);

			const attendanceTimeline = await TimelineType.firstOrCreate(
				{
					description: SharedService.GetAttendanceLabel(authCtx),
					system_id: authCtx.system.id,
				},
				{
					description: SharedService.GetAttendanceLabel(authCtx),
					color: "#000",
					requiresObservation: false,
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);

			await AnimalTimeline.create({
				timeline_id: attendanceTimeline.id,
				timeline_type: {
					description: attendanceTimeline.description,
					color: attendanceTimeline.color,
					requires_observation: attendanceTimeline.requiresObservation,
				},
				timeline_info: {
					tag: db_patient.id,
					event: "TROCA_TUTOR_PRINCIPAL",
					technician: {
						id: authCtx.user.id,
						name: authCtx.user.name,
					},
					old_tutor: {
						id: oldMainTutor?.id ?? null,
						name: oldMainTutor?.name ?? null,
					},
					new_tutor: {
						id: db_tutor?.id ?? null,
						name: db_tutor?.name ?? null,
					},
				},
			});
		});
	}

	public async checkExistingDocument(unitId: string, document: string) {
		const isValidDocument = this.sharedService.validDocument(document);
		if (!isValidDocument) {
			return {
				valid: false,
				exists: false,
			};
		}

		const group = await this.getEconomicGroup(unitId);
		const db_doc = await group
			.related("patients")
			.query()
			.whereHas("tutor", (query) => {
				query.where("document", document);
			})
			.first();

		return {
			valid: true,
			exists: Boolean(db_doc),
		};
	}

	public async checkExistingPhone(authContext: AuthContext, phone: string) {
		const sanitizedValue = phone.replace(/\D/g, "");

		const tutors = await Patient.query()
			.where("type", PatientType.TUTOR)
			.whereHas("economicGroup", (query) => {
				query.where("economic_group_id", authContext.group.id);
			})
			.whereHas("contacts", (query) => {
				query.whereRaw(
					`patient_contacts.type <> 'email'
  and (
    case
        when length(patient_contacts.contact) = 10 and length(?) = 11 then
            SUBSTRING(patient_contacts.contact, 1, 2) || '9' || SUBSTRING(patient_contacts.contact, 3, 8) ilike
            ? -- add o 9
        when length(patient_contacts.contact) = 11 and length(?) = 10 then patient_contacts.contact ilike
                                                                           '%' ||
                                                                           SUBSTRING(?, 1, 2) ||
                                                                           '9' ||
                                                                           SUBSTRING(?, 3, 8) ||
                                                                           '%' -- add o 9
        else patient_contacts.contact ilike ? end
    )`,
					[
						sanitizedValue,
						`%${sanitizedValue}%`,
						sanitizedValue,
						sanitizedValue,
						sanitizedValue,
						`%${sanitizedValue}%`,
					],
				);
			})
			.preload("dependents", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});
			})
			.preload("tutor", (query) => {
				query.preload("clientOrigin");
			});

		return tutors.map((tutor) => ({
			id: tutor.id,
			name: tutor.name,
			email: tutor.tutor.email,
			cellphone: tutor.tutor?.cellphone?.replace(/\D/g, ""),
			telephone: tutor.tutor?.telephone?.replace(/\D/g, ""),
			clientOrigin: tutor.tutor.clientOrigin,
			dependents: tutor.dependents.map((d) => {
				return {
					id: d.id,
					name: d.name,
					gender: d.gender,
					race: d?.patientAnimal?.race.toJSON(),
				};
			}),
		}));
	}

	private async getEconomicGroup(unitId: string) {
		const businessUnit = await BusinessUnit.findOrFail(unitId);
		return EconomicGroup.findOrFail(businessUnit.economicGroupId);
	}

	private async uploadPhoto(file: MultipartFileContract): Promise<string> {
		const key = `${v4()}.${file.extname}`;
		await file.moveToDisk(
			"patients",
			{
				name: key,
			},
			"local",
		);

		return Drive.getUrl(`patients/${key}`);
	}
}
