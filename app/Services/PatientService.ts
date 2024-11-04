import { inject } from "@adonisjs/fold";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Drive from "@ioc:Adonis/Core/Drive";
import Env from "@ioc:Adonis/Core/Env";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Bill, { BillStatus } from "App/Models/Bill";
import Budget, { BudgetStatus } from "App/Models/Budget";
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
import Attendance from "App/Models/Attendance";
import { intervalToDuration } from "date-fns";
import { PatientContactType } from "App/Models/PatientContact";
import PatientTutor from "App/Models/PatientTutor";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import HolderDependentLog from "App/Models/HolderDependentLog";

interface ISearch {
	id?: string;
	name?: string;
	gender?: PatientGender;
	type?: PatientType;
}

interface ISearchAnimals {
	id?: string;
	name?: string;
	tutor?: string;
	race?: string;
	specie?: string;
	document?: string;
	phone?: string;
	tag?: string;
}

interface ISearchTutor {
	id?: string;
	name?: string;
	document?: string;
	phone?: string;
	patient?: string;
	race?: string;
	tutorId?: string;
	patientId?: string;
}

interface ISearchSupplier {
	id?: string;
	name?: string;
	document?: string;
}

@inject()
export default class PatientService {
	constructor(private readonly sharedService: SharedService) {}

	static MESES = [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	];

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = authCtx.group
			.related("patients")
			.query()
			.preload("patientAnimal");

		if (data.id) {
			qb.where("id", data.id);
		}

		if (data.name) {
			qb.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
				data.name.replaceAll(" ", "%"),
			]);
		}

		if (data.gender) {
			qb.where("gender", data.gender);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			name: elem.name,
			type: elem.type,
			photo: elem.photo ?? null,
			gender: elem.gender ?? null,
			tags: elem.tags ?? "",
			birthDate: elem.birthDate,
			active: elem.active,
			created_at: elem.createdAt,
			updated_at: elem.updatedAt,
			vaccine_origin: elem.vaccineOrigin,
			tag: elem.tag,
			weight: elem.weight,
			weight_date: elem.weightDate,
			weight_origin: elem.weightOrigin,
			hypertension: elem.hypertension,
			diabetes: elem.diabetes,
			glycemia: elem.glycemia,
			pressure: elem.pressure,
			first_sale: elem.firstSale,
			client_origin_item_description: elem.clientOriginItemDescription,
			community: elem.community,
			birth_date: elem.birth_date,
			death: elem.patientAnimal?.death ?? null,
			raceId: elem.patientAnimal?.race_id ?? null,
		}));
	}

	public async nonPets(authCtx: AuthContext) {
		const qb = authCtx.group
			.related("patients")
			.query()
			.whereIn("type", [PatientType.TUTOR, PatientType.SUPPLIER])
			.preload("tutor");

		return qb;
	}

	public async reducedTutorsIndex(authCtx: AuthContext, data: ISearchTutor) {
		const qb = authCtx.group
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

		if (data.id) {
			qb.where("id", data.id);
		}

		if (data.name) {
			qb.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
				data.name.replaceAll(" ", "%"),
			]);
		}

		if (data.patient) {
			qb.whereHas("dependents", () => {
				qb.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
					data.patient!.replaceAll(" ", "%"),
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
				active: elem.active,
				type: elem.type,
				raceId: elem.patientAnimal?.race_id ?? null,
				death: elem.patientAnimal?.death ?? null,
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

	public async tutorsIndex(
		authCtx: AuthContext,
		data: ISearchTutor,
	): Promise<
		{
			id: string;
			name: string;
			tag: string;
			cellphone: string | null;
			document: string | null;
			dependents: {
				id: string;
				name: string;
				tag: string;
			}[];
		}[]
	> {
		const qb = Database.from("patient_economic_groups")
			.select(
				Database.raw(`patients.id,
       patients.name,
       patients.tag,
       patient_tutors.cellphone,
       patient_tutors.document,
       coalesce(
                       json_agg(
                       json_build_object(
                               'id', dep.id,
                               'name', dep.name,
                               'tag', dep.tag
                       ))
                       FILTER (WHERE dep.id IS NOT NULL),
                       '[]'::json
       ) as dependents`),
			)
			.orderByRaw("patients.name desc")
			.groupByRaw("patients.id, patient_tutors.id")
			.joinRaw(
				"join patients on patient_economic_groups.patient_id = patients.id",
			)
			.joinRaw("join patient_tutors on patients.id = patient_tutors.patient_id")
			.joinRaw(
				"left join client_origins on patient_tutors.client_origin_id = client_origins.id",
			)
			.joinRaw(
				"left join professions on patient_tutors.profession_id = professions.id",
			)
			.joinRaw(
				"left join holder_dependents on patients.id = holder_dependents.holder_id",
			)
			.joinRaw(
				"left join patients dep on holder_dependents.dependent_id = dep.id",
			)
			.whereRaw("patient_economic_groups.economic_group_id = ?", [
				authCtx.group.id,
			])
			.whereRaw("patients.type = ?", [PatientType.TUTOR]);

		if (data.id) {
			qb.where("patients.id", data.id);
		}

		if (data.name) {
			qb.whereRaw("unaccent(patients.name) ilike '%' || unaccent(?) || '%'", [
				data.name.replaceAll(" ", "%"),
			]);
		}

		if (data.document) {
			qb.whereRaw("patient_tutors.document ilike ?", [
				`%${data.document?.replace(/\D/g, "")}%`,
			]);
		}

		if (data.phone) {
			const clearPhone = data.phone.replace(/\D/g, "");
			qb.whereRaw(
				`exists (select *
              from "patient_contacts"
              where (patient_contacts.type <> 'email'
                  and (
                         case
                             when
                                 length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) =
                                 10 and length(?) = 11 then
                                 SUBSTRING(
                                         regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'),
                                         1, 2) || '9' || SUBSTRING(
                                         regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'),
                                         3, 8) ilike
                                 ? -- add o 9
                             when
                                 length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) =
                                 11 and length(?) = 10 then
                                 regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike
                                 '%' ||
                                 SUBSTRING(?, 1, 2) ||
                                 '9' ||
                                 SUBSTRING(?, 3, 8) ||
                                 '%' -- add o 9
                             else
                                 regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike
                                 ? end
                         ))
                and ("patients"."id" = "patient_contacts"."patient_id"))`,
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

		// if (data.patient || data.patientId) {
		// 	qb.whereHas("dependents", (query) => {
		// 		if (data.patient) {
		// 			query.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
		// 				data.patient!.replaceAll(" ", "%"),
		// 			]);
		// 		}
		//
		// 		if (data.patientId) {
		// 			query.where("holder_dependents.dependent_id", data.patientId);
		// 		}
		// 	});
		// }

		return await qb;
	}

	public async supplierIndex(authCtx: AuthContext, data: ISearchSupplier) {
		const qb = authCtx.group
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
			qb.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
				data.name!.replaceAll(" ", "%"),
			]);
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

	public async animalsIndex(authCtx: AuthContext, data: ISearchAnimals) {
		const qb = authCtx.group
			.related("patients")
			.query()
			.orderBy("name", "asc")
			.where("type", PatientType.ANIMAL);

		if (data.id) {
			qb.where("id", data.id);
		}

		if (data.tag) {
			qb.where("tag", data.tag);
		}

		if (data.race || data.specie) {
			qb.whereHas("patientAnimal", (query) => {
				query.whereHas("race", (subquery) => {
					if (data.race) {
						subquery.whereILike("description", `%${data.race ?? ""}%`);
					}

					if (data.specie) {
						subquery.whereHas("specie", (query) => {
							query.whereILike("description", `%${data.specie ?? ""}%`);
						});
					}
				});
			});
		}

		if (data.name) {
			qb.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
				data.name.replaceAll(" ", "%"),
			]);
		}

		if (data.document) {
			qb.whereHas("tutors", (q) => {
				q.whereRaw("document ilike ?", [
					`%${data.document?.replace(/\D/g, "")}%`,
				]);
			});
		}

		if (data.tutor) {
			qb.whereHas("tutors", (q) => {
				q.whereRaw("unaccent(name) ilike '%' || unaccent(?) || '%'", [
					data.tutor!.replaceAll(" ", "%"),
				]);
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
                            when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 10 and length(?) = 11 then
                                regexp_replace(SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 1, 2) || '9' ||
                                               SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 3, 8), 'D', '', 'g') ilike
                                ? -- add o 9
                            when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 11 and length(?) = 10 then
                                regexp_replace(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 'D', '', 'g') ilike
                                '%' || SUBSTRING(?, 1, 2) || '9' || SUBSTRING(?, 3, 8) || '%' -- add o 9
                            else regexp_replace(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 'D', '', 'g') ilike ? end
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

		const result = await qb;

		const tutors =
			data.tutor || data.document
				? await Database.from("patients")
						.select(Database.raw("patients.id, name as tutor"))
						.joinRaw(
							"join patient_economic_groups peg on patients.id = peg.patient_id and peg.economic_group_id = ?",
							[authCtx.group.id],
						)
						.joinRaw(
							"join patient_tutors on patient_tutors.patient_id = patients.id",
							[],
						)
						.where("type", PatientType.TUTOR)
						.whereRaw(
							"not exists (select * from holder_dependents hd where patients.id = hd.holder_id)",
						)
						.whereRaw(
							data.tutor
								? `(unaccent(patients.name) ilike '%' || unaccent(?) || '%')`
								: `(? = '' or 1=1)`,
							[data.tutor ?? ""],
						)
						.whereRaw(data.document ? `document ilike ?` : `(? = '' or 1=1)`, [
							data.document ? `%${data.document}%` : "",
						])
						.orderByRaw("name asc")
				: [];

		const patients = result.map((patient) => {
			return {
				id: patient.id,
				name: patient.name,
				tag: patient.tag,
				gender: patient.gender,
				community: patient.community,
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

		const $tutors = tutors.map((elem) => ({
			id: "-",
			tutors: [{ id: elem.id, name: elem.tutor }],
		}));

		return [...$tutors, ...patients];
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

	public async search(authCtx: AuthContext, data: ISearchPatient) {
		const tutors = await authCtx.group
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

	public async tutorNonPatients(authCtx: AuthContext, id: string) {
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

		const animalsIndex = await this.animalsIndex(authCtx, {});

		const dependents = tutor.dependents.map((d) => d.id);

		return animalsIndex.filter(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			(f) => !dependents.includes((f as unknown as Patient).id!),
		);
	}

	public async show(authCtx: AuthContext, patientId: string) {
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

		const openHospitalizations = await Hospitalization.query()
			.where("patient_id", patientId)
			.where("status", HospitalizationStatus.ACTIVE);

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

			return {
				...patient.toJSON(),
				tutors: mapped,
				isHospitalized: openHospitalizations.length > 0,
			};
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

		return {
			...patient.toJSON(),
			isHospitalized: openHospitalizations.length > 0,
		};
	}

	public async display(authCtx: AuthContext, patientId: string) {
		const patient = await authCtx.group
			.related("patients")
			.query()
			.where("patient_id", patientId)
			.preload("patientAnimal", (query) => {
				query.preload("race", (query) => {
					query.preload("specie");
				});
				query.preload("hair");
			})
			.preload("tutors", (query) => {
				query.preload("tutor").pivotColumns(["is_main"]);
			})
			.preload("contacts")
			.preload("tutor")
			.first();

		if (!patient) {
			throw new ResourceNotFoundException(
				"Paciente não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		const openHospitalizations = await Hospitalization.query()
			.where("patient_id", patientId)
			.where("status", HospitalizationStatus.ACTIVE);
		const sales = await Bill.query()
			.where(
				authCtx.system.name === "LiftOne" ? "client_id" : "patient_id",
				patient.id,
			)
			.where("status", BillStatus.A);
		const attendances = await Attendance.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("patient_id", patient.id)
			.whereNull("close_user_id");

		const displayData = {
			id: patient.id,
			name: patient.name,
			type: patient.type,
			photo: `${Env.get("FILE_UPLOAD_PREFIX")}${patient.photo ?? ""}`,
			gender: patient.gender,
			genderText: patient.gender
				? patient.gender === PatientGender.MALE
					? "Masculino"
					: "Feminino"
				: null,
			tags: patient.tags,
			community: patient.community,
			birth_date: patient.birthDate,
			age: patient.birthDate
				? patient.patientAnimal?.deathDate
					? this.dateDiff(
							patient.birthDate,
							patient.patientAnimal?.deathDate.toJSDate(),
						)
					: this.dateDiff(patient.birthDate, new Date())
				: "-",
			birth_date_text: patient.birthDate
				? new Intl.DateTimeFormat("pt-BR", {
						day: "numeric",
						month: "long",
					}).format(patient.birthDate)
				: "-",
			active: patient.active,
			tag: patient.tag,
			weight: patient.weight,
			weightDate: patient.weightDate,
			hypertension: patient.hypertension,
			diabetes: patient.diabetes,
			glycemia: patient.glycemia,
			pressure: patient.pressure,
			firstSale: patient.firstSale,
			vaccineOrigin: patient.vaccineOrigin,
			isHospitalized: openHospitalizations.length > 0,
			missingBills: this.sharedService.formatter.format(
				sales.reduce(
					(acc, curr) => acc + (curr.totalValue - curr.paidValue),
					0,
				),
			),
			openAttendances: attendances.length > 0,
			createdAt: patient.createdAt,
		};

		if (patient.patientAnimal) {
			Object.assign(displayData, {
				death: patient.patientAnimal.death,
				deathDate: patient.patientAnimal.deathDate,
				microchip: patient.patientAnimal.microchip,
				castrated: patient.patientAnimal.castrated,
				hairId: patient.patientAnimal.hair_id ?? null,
				hair: patient.patientAnimal.hair?.description ?? null,
				raceId: patient.patientAnimal.race_id ?? null,
				race: patient.patientAnimal.race?.description ?? null,
				specieId: patient.patientAnimal.race?.specie?.id ?? null,
				specie: patient.patientAnimal.race?.specie?.description ?? null,
			});
		}

		if (patient.tutors) {
			const mainTutor = patient.tutors.find((t) => t.$extras.pivot_is_main);
			if (mainTutor) {
				const obj = mainTutor;
				const tutorObj = obj.tutor;
				Object.assign(displayData, {
					tutor: {
						id: obj.id,
						name: obj.name,
						cellphone: tutorObj.cellphone ?? null,
						telephone: tutorObj.telephone ?? null,
						email: tutorObj.email ?? null,
						document: tutorObj.document ?? null,
						address: [
							tutorObj.street,
							tutorObj.number,
							tutorObj.complement,
							tutorObj.district,
							`${tutorObj.city ?? "-"} - ${tutorObj.state ?? "-"}`,
						]
							.filter(Boolean)
							.join(", "),
					},
				});
			}

			Object.assign(displayData, {
				holders: patient.tutors.map((elem) => ({
					id: elem.id,
					name: elem.name,
					cellphone: elem.tutor.cellphone ?? null,
					telephone: elem.tutor.telephone ?? null,
					email: elem.tutor.email ?? null,
					document: elem.tutor.document ?? null,
					main: elem.$extras.pivot_is_main,
				})),
			});
		}

		if (patient.tutor) {
			Object.assign(displayData, {
				document: patient.tutor?.document ?? null,
				rg: patient.tutor?.document ?? null,
				nationality: patient.tutor?.nationality ?? null,
				clientOriginId: patient.tutor?.client_origin_id ?? null,
				tags: patient.tags ?? null,
				civilStatus: patient.tutor.civilStatus ?? null,
				professionId: patient.tutor.profession_id ?? null,
				cellphone: patient.tutor?.cellphone ?? null,
				telephone: patient.tutor?.telephone ?? null,
				email: patient.tutor?.email ?? null,
				observation: "",
				fullAddress: [
					patient?.tutor.street,
					patient?.tutor.number,
					patient?.tutor.complement,
					patient?.tutor.district,
					`${patient?.tutor.city ?? "-"} - ${patient?.tutor.state ?? "-"}`,
				]
					.filter(Boolean)
					.join(", "),
				// address: {
				// 	cep: patient.tutor.postalCode,
				// 	logradouro: patient.tutor.street,
				// 	complemento: patient.tutor.complement ?? null,
				// 	bairro: patient.tutor.district,
				// 	localidade: patient.tutor.city,
				// 	uf: patient.tutor.state,
				// 	zipCode: patient.tutor.postalCode,
				// 	number: patient.tutor.number,
				// 	fullAddress: [
				// 		patient.tutor.street,
				// 		patient.tutor.number,
				// 		patient.tutor.complement,
				// 		patient.tutor.district,
				// 		`${patient.tutor.city ?? "-"} - ${patient.tutor.state ?? "-"}`,
				// 	]
				// 		.filter(Boolean)
				// 		.join(", "),
				// },
				contacts: patient.contacts.map((elem) => ({
					contact: elem.contact,
					main: elem.main,
					notGiven: elem.notGiven,
					observation: elem.observation,
					type: elem.type,
				})),
			});
		}

		return displayData;
	}

	public async tutorDisplay(
		authCtx: AuthContext,
		patientId: string,
	): Promise<
		Omit<IPatientTutorData, "photo" | "birthDate"> & {
			id: string;
			photo: string | null;
			birthDate: DateTime | null;
			contacts?: {
				main: boolean;
				notGiven: boolean;
				contact?: string;
				observation?: string;
				type: (typeof PatientContactType)[number];
			}[];
			patients: { id: string; name: string }[];
		}
	> {
		const patient = await authCtx.group
			.related("patients")
			.query()
			.where("patient_id", patientId)
			.where("type", PatientType.TUTOR)
			.preload("tutors", (query) => {
				query.preload("tutor").pivotColumns(["is_main"]);
			})
			.preload("contacts")
			.preload("tutor")
			.preload("dependents")
			.first();

		if (!patient) {
			throw new ResourceNotFoundException(
				"Paciente não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return {
			id: patient.id,
			name: patient.name,
			clientOriginId: patient.tutor.client_origin_id,
			clientOriginItemDescription: patient.clientOriginItemDescription,
			photo: patient.photo
				? `${Env.get("FILE_UPLOAD_PREFIX")}${patient.photo ?? "#"}`
				: null,
			gender: patient.gender,
			tags: patient.tags,
			birthDate: patient.birthDate
				? DateTime.fromJSDate(patient.birthDate)
				: null,
			active: patient.active,
			document: patient.tutor.document,
			inscription: patient.tutor.inscription,
			corporate_name: patient.tutor.corporateName,
			telephone: patient.tutor.telephone,
			message_person_name: patient.tutor.messagePersonName,
			message_person_phone: patient.tutor.messagePersonPhone,
			address: {
				residence: patient.tutor.residence,
				zipCode: patient.tutor.postalCode,
				logradouro: patient.tutor.street,
				number: patient.tutor.number,
				complemento: patient.tutor.complement,
				bairro: patient.tutor.district,
				localidade: patient.tutor.city,
				uf: patient.tutor.state,
				ibge: patient.tutor.cityCode,
			},
			diabetes: patient.diabetes,
			hypertension: patient.hypertension,
			professionId: patient.tutor.profession_id,
			nationality: patient.tutor.nationality,
			civilStatus: patient.tutor.civilStatus,
			contacts: patient.contacts.map((elem) => ({
				contact: elem.contact,
				main: elem.main,
				notGiven: elem.notGiven,
				observation: elem.observation,
				type: elem.type,
			})),
			patients: patient.dependents.map((elem) => ({
				id: elem.id,
				name: elem.name,
			})),
		};
	}

	public async metadata(authCtx: AuthContext, patientId: string) {
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

		const key = authCtx.system.name === "LiftOne" ? "client_id" : "patient_id";
		const sales = await Bill.query()
			.where(key, patient.id)
			.where("status", BillStatus.A);

		const missing = sales.reduce((acc, curr) => {
			return acc + (curr.totalValue - curr.paidValue);
		}, 0);

		return {
			missingFromBills: missing,
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
			.orderByRaw("bill_date desc, tag desc");

		const budgets = await Budget.query()
			.where(key, patient.id)
			.where("status", BudgetStatus.A)
			.preload("seller")
			.preload(key === "patient_id" ? "client" : "user")
			.orderByRaw("budget_date desc, tag desc");

		const budgetStatuses: { id: string; status: string }[] =
			await Database.from("budgets")
				.select(
					Database.raw(
						`id,
       case
           when
               (select true
                from budget_items
                where (courtesy = true or max_discount = true)
                  and (approved = false and courtesy_approved_at is not null)
                  and deleted_at is null
                  and budget_items.budget_id = budgets.id
                group by budget_id) = true then 'Nao Aprovada'
           else budgets.status end as status`,
					),
				)
				.whereIn(
					"id",
					budgets.map((b) => b.id),
				)
				.orderByRaw("created_at desc");

		const billStatuses: { id: string; status: string }[] = await Database.from(
			"bills",
		)
			.select(
				Database.raw(
					`id,
       case
           when
               (select true
                from bill_items
                where (courtesy = true or max_discount = true)
                  and (approved = false and courtesy_approved_at is not null)
                  and deleted_at is null
                  and bill_items.bill_id = bills.id
                group by bill_id) = true then 'Nao Aprovada'
           else bills.status end as status`,
				),
			)
			.whereIn(
				"id",
				sales.map((b) => b.id),
			)
			.orderByRaw("created_at desc");

		const result: Array<unknown> = [];

		for (const sale of sales) {
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
				pending: sale.pending,
				missing_value:
					sale.totalValue -
					sale.payments.reduce((acc, curr) => acc + curr.totalValue, 0),
				status:
					billStatuses.find((s) => s.id === sale.id)?.status ??
					getStrStatus(sale),
			});
		}

		for (const budget of budgets) {
			result.push({
				id: budget.id,
				_type: "budget" as const,
				tag: budget.tag,
				date: budget.budgetDate,
				seller: budget.seller ? budget.seller.name : authCtx.user.name,
				client: key === "patient_id" ? budget.client?.name : budget.user?.name,
				total_value: budget.totalValue,
				pending: budget.pending,
				missing_value: null,
				// status: "Orçamento em aberto",
				status:
					budgetStatuses.find((s) => s.id === budget.id)?.status ??
					"Orçamento em aberto",
			});
		}

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

	public async fastStore(authCtx: AuthContext, data: IFastStorePatient) {
		const client = Database.connection();
		return Database.transaction(async (trx) => {
			const [{ next_id = 1 }] = await Database.from("economic_groups")
				.select(Database.raw(`max(coalesce(tag, '0')::int) + 1 as next_id`))
				.joinRaw(
					"left join patient_economic_groups on economic_groups.id = patient_economic_groups.economic_group_id",
				)
				.joinRaw(
					"left join patients on patient_economic_groups.patient_id = patients.id",
				)
				.where("economic_groups.id", authCtx.group.id);

			const tutor = await Patient.create(
				{
					name: data.tutorName ?? `Não informado - ${data.tutorPhone}`,
					type: PatientType.TUTOR,
					tag: next_id.toString(),
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

			await authCtx.group.related("patients").attach([tutor.id], trx);

			if (data.patientName || data.patientRaceId || data.patientGender) {
				patient = await Patient.create(
					{
						name: data.patientName,
						gender: data.patientGender,
						type: PatientType.ANIMAL,
						tag: next_id.toString(),
					},
					{
						client: trx,
					},
				);

				await tutor.related("dependents").attach([patient.id], trx);
				await authCtx.group.related("patients").attach([patient.id], trx);
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
		authCtx: AuthContext,
		data: Omit<IPatientData, "active">,
	): Promise<Patient> {
		// não é nem CRM nem Agenda, vai precisar ter bithDate ou birthMonths + birthDays
		if (
			data.holders &&
			!data.birthDate &&
			!data.birthDays &&
			!data.birthMonths &&
			!data.birthYears
		) {
			throw new BadRequestException(
				"É preciso ou informar a data exata ou aproximada de nascimento",
				400,
				"E_ERR",
			);
		}

		return Database.transaction(async (trx) => {
			const [{ next_id = 1 }] = await Database.from("economic_groups")
				.select(Database.raw(`max(coalesce(tag, '0')::int) + 1 as next_id`))
				.joinRaw(
					"left join patient_economic_groups on economic_groups.id = patient_economic_groups.economic_group_id",
				)
				.joinRaw(
					"left join patients on patient_economic_groups.patient_id = patients.id",
				)
				.where("economic_groups.id", authCtx.group.id)
				.limit(1);

			const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

			const patient = await Patient.create(
				{
					name: data.name,
					gender: data.gender,
					tags: data.tags,
					community: data.community,
					birthDate: data.birthDate
						? DateTime.fromISO(data.birthDate).toJSDate()
						: DateTime.now()
								.minus({
									years: data.birthYears ?? 0,
									months: data.birthMonths ?? 0,
									days: data.birthDays ?? 0,
								})
								.toJSDate(),
					type: PatientType.ANIMAL,
					photo,
					vaccineOrigin: data.vaccineOrigin,
					tag: next_id.toString(),
					hypertension: data.hypertension,
					diabetes: data.diabetes,
					glycemia: data.glycemia,
					pressure: data.pressure,
				},
				{
					client: trx,
				},
			);

			const tasks =
				data.holders?.map(async (elem) => {
					const holder = await Patient.findOrFail(elem.id, {
						client: trx,
					});

					if (holder.type !== PatientType.TUTOR) {
						throw new BadRequestException(
							"Tutor inválido",
							400,
							"E_BAD_REQUEST",
						);
					}

					await holder
						.related("dependents")
						.attach({ [patient.id]: { is_main: elem.main } }, trx);
				}) ?? [];
			await Promise.all(tasks);

			await authCtx.group.related("patients").attach([patient.id], trx);

			await patient.related("patientAnimal").create(
				{
					race_id: data.raceId,
					hair_id: data.hairId,
					microchip: data.microchip,
					castrated: data.castrated,
				},
				trx,
			);

			if (data.holders) {
				await patient.related("tutors").sync(
					data.holders.reduce(
						(acc, curr) => {
							acc[curr.id] = { is_main: curr.main };

							return acc;
						},
						{} as Record<number, Record<string, unknown>>,
					),
					false,
					trx,
				);
			}

			await trx.commit();

			return patient;
		});
	}

	public async storeTutor(
		authCtx: AuthContext,
		data: Omit<IPatientTutorData, "active"> & {
			contacts?: {
				main: boolean;
				notGiven: boolean;
				contact?: string;
				observation?: string;
				type: (typeof PatientContactType)[number];
			}[];
			patients?: { id: string }[];
		},
	): Promise<Patient> {
		return Database.transaction(async (trx) => {
			if (data.document) {
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

			const [{ next_id = 1 }] = await Database.from("economic_groups")
				.select(Database.raw(`max(coalesce(tag, '0')::int) + 1 as next_id`))
				.joinRaw(
					"left join patient_economic_groups on economic_groups.id = patient_economic_groups.economic_group_id",
				)
				.joinRaw(
					"left join patients on patient_economic_groups.patient_id = patients.id",
				)
				.where("economic_groups.id", authCtx.group.id);

			const patient = await Patient.create(
				{
					name: data.name,
					birthDate: data.birthDate
						? DateTime.fromISO(data.birthDate).toJSDate()
						: undefined,
					gender: data.gender,
					tags: data.tags,
					photo,
					type: PatientType.TUTOR,
					diabetes: data.diabetes,
					hypertension: data.hypertension,
					tag: next_id.toString(),
					clientOriginItemDescription: data.clientOriginItemDescription,
				},
				{ client: trx },
			);

			await patient.related("tutor").create(
				{
					residence: data.address?.residence,
					document: data.document?.replace(/\D/g, ""),
					inscription: data.inscription,
					corporateName: data.corporate_name,
					// email: data.email,
					// cellphone: data.cellphone,
					telephone: data.telephone,
					messagePersonName: data.message_person_name,
					messagePersonPhone: data.message_person_phone,
					postalCode: data.address?.zipCode,
					street: data.address?.logradouro,
					number: data.address?.number,
					complement: data.address?.complemento,
					district: data.address?.bairro,
					city: data.address?.localidade,
					state: data.address?.uf,
					client_origin_id: data.clientOriginId,
					cityCode: data.address?.ibge,

					civilStatus: data.civilStatus,
					nationality: data.nationality,
					profession_id: data.professionId,
				},
				{
					client: trx,
				},
			);

			const result = await patient.related("contacts").createMany(
				data.contacts
					?.filter((f) => !!f.contact)
					?.map((inner) => ({
						main: inner.main,
						contact: inner.contact === "-" ? undefined : inner.contact,
						observation: inner.observation,
						type: inner.type,
						notGiven: inner.notGiven,
					})) ?? [],
				{ client: trx },
			);

			const updateTasks = result
				.flat()
				.filter((f) => typeof f.contact !== "undefined")
				.map((elem) => {
					if (elem.type === "celular") {
						return PatientTutor.query()
							.debug(true)
							.where("patient_id", elem.patient_id)
							.useTransaction(trx)
							.update({
								cellphone: elem.contact,
							});
					}

					if (elem.type === "email") {
						return PatientTutor.query()
							.where("patient_id", elem.patient_id)
							.debug(true)
							.useTransaction(trx)
							.update({
								email: elem.contact,
							});
					}

					if (["residencial", "comercial", "recado"].includes(elem.type)) {
						return PatientTutor.query()
							.where("patient_id", elem.patient_id)
							.debug(true)
							.useTransaction(trx)
							.update({
								telephone: elem.contact,
							});
					}
				});
			await Promise.all(updateTasks);

			await authCtx.group.related("patients").attach([patient.id], trx);

			if (data.patients) {
				await patient.related("dependents").sync(
					data.patients
						.map((p) => p.id)
						.reduce(
							(acc, curr) => {
								if (!acc[curr]) {
									acc[curr] = {
										is_main: true,
									};
								}

								return acc;
							},
							{} as Record<string, { is_main: boolean }>,
						),
					false,
					trx,
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
		authCtx: AuthContext,
		data: Omit<IPatientSupplierData, "active">,
	): Promise<Patient> {
		return Database.transaction(async (trx) => {
			if (data.document) {
				// if (!this.sharedService.validDocument(data.document)) {
				// 	throw new BadRequestException(
				// 		"Documento inválido",
				// 		400,
				// 		"E_INVALID_DOCUMENT",
				// 	);
				// }

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
						`Este Cpf/Cnpj já existe neste Grupo Economico para o Fornecedor "${data.name}"`,
						400,
						"E_DOCUMENT_ALREADY_REGISTERED",
					);
				}
			}

			const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

			const [{ next_id = 1 }] = await Database.from("economic_groups")
				.select(Database.raw(`max(coalesce(tag, '0')::int) + 1 as next_id`))
				.joinRaw(
					"left join patient_economic_groups on economic_groups.id = patient_economic_groups.economic_group_id",
				)
				.joinRaw(
					"left join patients on patient_economic_groups.patient_id = patients.id",
				)
				.where("economic_groups.id", authCtx.group.id);

			const patient = await Patient.create(
				{
					name: data.name,
					tags: data.tags,
					photo,
					type: PatientType.SUPPLIER,
					tag: next_id.toString(),
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

			await authCtx.group.related("patients").attach([patient.id], trx);

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

			holders?: { id: string }[];
		},
	) {
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
					community: data.community,
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

			const tasks =
				data.holders?.map(async (elem) => {
					const holder = await Patient.findOrFail(elem.id, {
						client: trx,
					});

					if (holder.type !== PatientType.TUTOR) {
						throw new BadRequestException(
							"Tutor inválido",
							400,
							"E_BAD_REQUEST",
						);
					}

					await holder
						.related("dependents")
						.query()
						.useTransaction(trx)
						.where("dependent_id", patient.id)
						.update({ is_main: elem.main });
				}) ?? [];
			await Promise.all(tasks);

			if (data.holders) {
				await patient.related("tutors").sync(
					data.holders.reduce(
						(acc, curr) => {
							acc[curr.id] = { is_main: curr.main };

							return acc;
						},
						{} as Record<number, Record<string, unknown>>,
					),
					false,
					trx,
				);
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
				deathDate: data.deathDate,
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
					realizedAt: data.deathDate,
					observation: "-",
					issuedAt: DateTime.now(),
					deathObservation: data.deathObservation,
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
						"data.deathAt": data.deathDate,
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
					realized: data.deathDate,
					resume: "Óbito",
					description: "-",
					deathObservation: data.deathObservation,
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
		data: IPatientTutorData & {
			contacts?: {
				main: boolean;
				notGiven: boolean;
				contact?: string;
				observation?: string;
				type: (typeof PatientContactType)[number];
			}[];
			patients?: { id: string }[];
		},
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

			if (data.document && data.document !== tutor.tutor.document) {
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
			await tutor.related("contacts").query().useTransaction(trx).delete();

			const result = await tutor.related("contacts").createMany(
				data.contacts
					?.filter((f) => typeof f.contact !== "undefined")
					?.map((inner) => ({
						main: inner.main,
						contact: inner.contact === "-" ? undefined : inner.contact,
						observation: inner.observation,
						type: inner.type,
						notGiven: inner.notGiven,
					})) ?? [],
				{ client: trx },
			);

			const updateTasks = result
				.flat()
				.filter((e) => !!e.contact)
				.map((elem) => {
					if (elem.type === "celular") {
						return PatientTutor.query()
							.where("patient_id", elem.patient_id)
							.useTransaction(trx)
							.update({
								cellphone: elem.contact,
							});
					}

					if (elem.type === "email") {
						return PatientTutor.query()
							.where("patient_id", elem.patient_id)
							.useTransaction(trx)
							.update({
								email: elem.contact,
							});
					}

					if (["residencial", "comercial", "recado"].includes(elem.type)) {
						return PatientTutor.query()
							.where("patient_id", elem.patient_id)
							.useTransaction(trx)
							.update({
								telephone: elem.contact,
							});
					}
				});
			await Promise.all(updateTasks);

			await tutor.tutor
				.merge({
					residence: data.address?.residence,
					document: data.document?.replace(/\D/g, ""),
					inscription: data.inscription,
					corporateName: data.corporate_name,
					// email: data.email,
					// cellphone: data.cellphone,
					telephone: data.telephone,
					messagePersonName: data.message_person_name,
					messagePersonPhone: data.message_person_phone,
					postalCode: data.address?.zipCode,
					street: data.address?.logradouro,
					number: data.address?.number,
					complement: data.address?.complemento,
					district: data.address?.bairro,
					city: data.address?.localidade,
					state: data.address?.uf,
					client_origin_id: data.clientOriginId,
					cityCode: data.address?.ibge,
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
					birthDate: data.birthDate
						? DateTime.fromISO(data.birthDate).toJSDate()
						: undefined,
					active: data.active,
					diabetes: data.diabetes,
					hypertension: data.hypertension,
					clientOriginItemDescription: data.clientOriginItemDescription,
				})
				.useTransaction(trx)
				.save();

			if (data.patients) {
				await tutor.related("dependents").sync(
					data.patients.map((p) => p.id),
					false,
					trx,
				);
			}

			return tutor;
		});
	}

	public async updateSupplier(
		authCtx: AuthContext,
		id: string,
		data: IPatientSupplierData,
	): Promise<Patient> {
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

	public async unlinkHolderDependent(
		authCtx: AuthContext,
		data: {
			tutorId: string;
			patientId: string;
		},
	) {
		if (!authCtx.hasPermission("PET04")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para fazer a atividade",
				400,
				"E_ERR",
			);
		}

		await Database.transaction(async (trx) => {
			const db_patient = await Patient.query()
				.useTransaction(trx)
				.where("id", data.patientId)
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
				.where("id", data.tutorId)
				.where("type", PatientType.TUTOR)
				.first();

			if (!db_tutor) {
				throw new BadRequestException("Tutor inválido", 400, "E_BAD_REQUEST");
			}

			const rows = await Database.from("holder_dependents")
				.select("id")
				.whereRaw("holder_id = ? and dependent_id = ?", [
					data.tutorId,
					data.patientId,
				]);
			if (rows.length === 0) {
				throw new BadRequestException(
					"Não existe relação entre tutor e paciente",
					400,
					"E_ERR",
				);
			}

			await db_tutor.related("dependents").detach([db_patient.id], trx);

			await HolderDependentLog.create(
				{
					holder_id: data.tutorId,
					dependent_id: data.patientId,
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				},
				{ client: trx },
			);
		});
	}

	public async checkExistingDocument(authCtx: AuthContext, document: string) {
		const isValidDocument = this.sharedService.validDocument(document);
		if (!isValidDocument) {
			return {
				valid: false,
				exists: false,
			};
		}

		const db_doc = await authCtx.group
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
        when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 10 and length(?) = 11 then
            SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 1, 2) || '9' || SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 3, 8) ilike
            ? -- add o 9
        when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 11 and length(?) = 10 then regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike
                                                                           '%' ||
                                                                           SUBSTRING(?, 1, 2) ||
                                                                           '9' ||
                                                                           SUBSTRING(?, 3, 8) ||
                                                                           '%' -- add o 9
        else regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike ? end
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

	private dateDiff(from: Date, to: Date) {
		const { years, months, days } = intervalToDuration({
			start: from,
			end: to,
		});
		const tokens: string[] = [];

		if (years) {
			tokens.push(`${years} ${years === 1 ? "ano" : "anos"}`);
		}

		if (months) {
			tokens.push(`${months} ${months === 1 ? "mês" : "meses"}`);
		}

		if (days) {
			tokens.push(`${days} ${days === 1 ? "dia" : "dias"}`);
		}

		return tokens.join(", ");
	}
}
