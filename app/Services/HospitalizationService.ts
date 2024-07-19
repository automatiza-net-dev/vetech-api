import { inject } from "@adonisjs/fold";
import Logger from "@ioc:Adonis/Core/Logger";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Bed from "App/Models/Bed";
import Hospitalization, {
	HospitalizationStatus,
	HospitalizationType,
	HospitalizationTypeDescription,
} from "App/Models/Hospitalization";
import HospitalizationMedicalPrescription, {
	THospitalizationMedicalPrescriptionStatus,
} from "App/Models/HospitalizationMedicalPrescription";
import HospitalizationMedicalPrescriptionScheduling, {
	THospitalizationMedicalPrescriptionSchedulingStatus,
} from "App/Models/HospitalizationMedicalPrescriptionScheduling";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import HospitalizationTimeline from "App/Models/mongoose/HospitalizationTimeline";
import Occurrence, { OccurrenceType } from "App/Models/Occurrence";
import Patient, { PatientType } from "App/Models/Patient";
import TimelineType from "App/Models/TimelineType";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { IHospitalizationData } from "Contracts/interfaces/IHospitalizationData";
import { DateTime } from "luxon";

interface ISearch {
	tutor?: string;
	patient?: string;
	bed?: string;
}

interface IHome {
	hospitalized_from?: string;
	hospitalized_to?: string;

	finished_from?: string;
	finished_to?: string;

	released_from?: string;
	released_to?: string;

	death_from?: string;
	death_to?: string;

	patientName?: string;
	patientTag?: string;
	tutorName?: string;

	type?: string;
	status?: string;
}

@inject()
export default class HospitalizationService {
	constructor(private readonly sharedService: SharedService) {}

	public async parsedIndex(unitId: string, data: IHome) {
		const qb = Hospitalization.query()
			.where("business_unit_id", unitId)
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});
			})
			.preload("tutor", (query) => {
				query.preload("tutor");
			})
			.preload("technician");

		if (data.hospitalized_from) {
			qb.whereRaw("created_at::date >= ?", [data.hospitalized_from]);
		}

		if (data.hospitalized_to) {
			qb.whereRaw("created_at::date <= ?", [data.hospitalized_to]);
		}

		if (data.finished_from) {
			qb.whereRaw("finished_at::date >= ?", [data.finished_from]);
		}

		if (data.finished_to) {
			qb.whereRaw("finished_at::date <= ?", [data.finished_to]);
		}

		if (data.released_from) {
			qb.whereRaw("released_at::date >= ?", [data.released_from]);
		}

		if (data.released_to) {
			qb.whereRaw("released_at::date <= ?", [data.released_to]);
		}

		if (data.death_from) {
			qb.whereRaw("death_at::date >= ?", [data.death_from]);
		}

		if (data.death_to) {
			qb.whereRaw("death_at::date <= ?", [data.death_to]);
		}

		if (data.type) {
			qb.whereRaw("type = ?", [data.type]);
		}

		if (data.tutorName) {
			qb.whereHas("tutor", (query) => {
				query
					.whereRaw("name ~* ?", [data.tutorName ?? ""])
					.where("type", PatientType.TUTOR);
			});
		}

		if (data.patientName || data.patientTag) {
			qb.whereHas("patient", (query) => {
				query.where("type", PatientType.ANIMAL);

				if (data.patientName) {
					query.whereRaw("name ~* ?", [data.patientName]);
				}

				if (data.patientTag) {
					query.whereRaw("tag ~* ?", [data.patientTag]);
				}
			});
		}

		if (data.status?.toLowerCase() === "em aberto") {
			qb.whereNull("finished_at");
		} else if (data.status?.toLowerCase() === "finalizadas") {
			qb.whereNotNull("finished_at");
		} else if (data.status?.toLowerCase() === "alta") {
			qb.whereNotNull("released_at").whereNull("death_at");
		} else if (data.status?.toLowerCase() === "obito") {
			qb.whereNotNull("death_at");
		}

		const result = await qb;

		return result.map((r) => ({
			id: r.id,
			type: r.type,
			risk: r.risk,
			expectedDischarge: r.expectedDischarge,
			status: r.status,
			releasedAt: r.releasedAt,
			finishedAt: r.finishedAt,
			createdAt: r.createdAt,
			deathAt: r.deathAt,
			technician: this.sharedService.captureGroup(r.technician, (v) => v.name),
			complaint: r.complaint,
			diagnosis: r.diagnosis,
			prognosis: r.prognosis,
			tutor: this.sharedService.captureGroup(r.tutor, (v) => ({
				id: v.id,
				name: v.name,
				cellphone: v.tutor?.cellphone ?? null,
			})),
			patient: this.sharedService.captureGroup(r.patient, (v) => ({
				id: v.id,
				name: v.name,
				gender: v.gender,
				tag: v.tag,
				birthDate: v.birthDate,
				death: v.patientAnimal?.death ?? null,
				deathDate: v.patientAnimal?.deathDate ?? null,
				fur: v.patientAnimal?.race?.fur ?? null,
				race: v.patientAnimal?.race.description ?? null,
				specie: v.patientAnimal.race?.specie?.description ?? null,
				weight: v.weight,
				weightDate: v.weightDate,
				weightOrigin: v.weightOrigin,
			})),
		}));
	}

	public async timeline(unitId: string, id: string) {
		const hospitalization = await Hospitalization.find(id);

		if (!hospitalization || hospitalization.business_unit_id !== unitId) {
			throw this.sharedService.ResourceNotFound();
		}

		return HospitalizationTimeline.find({
			"meta.hospitalization": hospitalization.id,
			"extra.deletedAt": null,
		});
	}

	public async patientTimeline(id: string) {
		const patient = await Patient.query()
			.where("id", id)
			.preload("hospitalizations")
			.first();

		if (!patient) {
			throw this.sharedService.ResourceNotFound();
		}

		return HospitalizationTimeline.find({
			"meta.hospitalization": {
				$in: patient.hospitalizations.map((h) => h.id),
			},
			"extra.deletedAt": null,
		});
	}

	public async index(unitId: string, data: ISearch) {
		const qb = Hospitalization.query()
			.preload("bed")
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
					query.preload("hair");
				});
			})
			.preload("tutor", (query) => {
				query.preload("tutor", (query) => {
					query.select([
						"cellphone",
						"name",
						"document",
						"postal_code",
						"street",
						"number",
						"complement",
						"district",
						"city",
						"state",
					]);
				});
			})
			.preload("technician")
			.preload("medicalPrescriptions", (query) => {
				query.whereRaw("(status = ? or status = ?)", [
					"Aberto",
					"Executado",
				] as THospitalizationMedicalPrescriptionStatus[]);

				query.preload("prescriptionUnit");
				query.preload("fluidUnit");
				query.preload("drugAdministration");
				query.preload("user");
				query.preload("scheduling", (query) => {
					query.preload("executionUser");
				});
			})
			.preload("occurrences", (query) => {
				query.preload("occurrence");
				query.preload("user");
				query.preload("prescription");
				query.preload("attachments");
			})
			.preload("parameters", (query) => {
				query.preload("parameter");
				query.preload("user");
			});

		qb.where("business_unit_id", unitId).where(
			"status",
			HospitalizationStatus.ACTIVE,
		);

		if (data.tutor) {
			qb.where("tutor_id", data.tutor);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		if (data.bed) {
			qb.where("bed_id", data.bed);
		}

		return qb;
	}

	public async completedIndex(unitId: string, data: ISearch) {
		const qb = Hospitalization.query()
			.preload("bed")
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});
			})
			.preload("tutor", (query) => {
				query.preload("tutor", (query) => {
					query.select(["cellphone"]);
				});
			})
			.preload("technician")
			.preload("medicalPrescriptions", (query) => {
				query.preload("prescriptionUnit");
				query.preload("fluidUnit");
				query.preload("drugAdministration");
				query.preload("user");
			})
			.preload("occurrences", (query) => {
				query.preload("occurrence");
				query.preload("user");
				query.preload("prescription");
				query.preload("attachments");
			})
			.preload("parameters", (query) => {
				query.preload("parameter");
				query.preload("user");
			});

		qb.where("business_unit_id", unitId).where(
			"status",
			HospitalizationStatus.COMPLETE,
		);

		if (data.tutor) {
			qb.where("tutor_id", data.tutor);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		if (data.bed) {
			qb.where("bed_id", data.bed);
		}

		return qb;
	}

	public async show(unitId: string, id: string) {
		const qb = Hospitalization.query()
			.preload("bed")
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});
			})
			.preload("tutor")
			.preload("technician")
			.preload("medicalPrescriptions", (query) => {
				query.preload("prescriptionUnit");
				query.preload("fluidUnit");
				query.preload("drugAdministration");
				query.preload("user");
			})
			.preload("occurrences", (query) => {
				query.preload("occurrence");
				query.preload("user");
				query.preload("prescription");
				query.preload("attachments");
			})
			.preload("parameters", (query) => {
				query.preload("parameter");
				query.preload("user");
			});

		qb.where("business_unit_id", unitId).where("id", id);

		const hospitalization = await qb.first();

		if (!hospitalization) {
			throw this.sharedService.ResourceNotFound();
		}

		return hospitalization;
	}

	public async getScheduling(unitId: string, id: string) {
		const qb = Hospitalization.query()
			.where("business_unit_id", unitId)
			.where("id", id);

		const hospitalization = await qb.first();

		if (!hospitalization) {
			throw this.sharedService.ResourceNotFound();
		}

		return HospitalizationMedicalPrescriptionScheduling.query().where(
			"hospitalization_id",
			hospitalization.id,
		);
	}

	public async store(authCtx: AuthContext, data: IHospitalizationData) {
		const ent = await Database.transaction(async (trx) => {
			const patient = await Patient.findOrFail(data.patientId);
			const tutor = await Patient.findOrFail(data.tutorId);
			const bed = data.bedId ? await Bed.findOrFail(data.bedId) : null;
			const technician = data.userId
				? await User.findOrFail(data.userId)
				: authCtx.user;

			const existingInternation = await Hospitalization.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("patient_id", data.patientId)
				.where("status", HospitalizationStatus.ACTIVE)
				.first();
			if (existingInternation) {
				throw new BadRequestException(
					"Paciente já internado",
					400,
					"E_ALREADY_HOSPITALIZED",
				);
			}

			const occurrence = await Occurrence.query()
				.useTransaction(trx)
				.where("type", OccurrenceType.ADMISSAO_INTERNACAO)
				.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
					authCtx.group.id,
				])
				.where("system_id", authCtx.system.id)
				.first();

			const ent = await Hospitalization.create(
				{
					type: data.type,
					risk: data.risk,
					complaint: data.complaint,
					expectedDischarge: data.expectedDischarge,
					diagnosis: data.diagnosis,
					prognosis: data.prognosis,
					status: HospitalizationStatus.ACTIVE,
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					patient_id: data.patientId,
					tutor_id: data.tutorId,
					bed_id: data.bedId,
					technician_id: technician.id,
				},
				{
					client: trx,
				},
			);

			if (occurrence) {
				await ent.related("occurrences").create(
					{
						occurrence_id: occurrence.id,
						description: `Internação do paciente ${patient?.name} por ${
							authCtx.user.name
						} às ${DateTime.local().toFormat("dd/MM/yyyy HH:mm")}`,
						executedAt: DateTime.now(),
						user_id: authCtx.user.id,
					},
					{
						client: trx,
					},
				);
			} else {
				Logger.error(
					"Não existe ocorrência de internação cadastrada para o grupo econômico",
				);
			}

			await HospitalizationTimeline.create({
				meta: {
					hospitalization: ent.id,
					group: authCtx.group.id,
					unit: authCtx.unit.id,
					type: "begin_hospitalization",
				},
				data: {
					tutor: {
						id: tutor.id,
						name: tutor.name,
					},
					patient: {
						id: patient.id,
						name: patient.name,
					},
					technician: {
						id: technician.id,
						name: technician.name,
					},
					type: HospitalizationType[data.type],
					risk: data.risk,
					complaint: data.complaint,
					diagnosis: data.diagnosis,
					prognosis: data.prognosis,
					expectedDischarge: data.expectedDischarge,
					hospitalizedAt: ent.createdAt,
					releasedAt: null,
					deathAt: null,
					bed: bed
						? {
								id: bed?.id,
								name: bed?.name,
								tag: bed?.tag,
							}
						: null,
					status: data.status,
				},
			});

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
					tag: ent.patient_id,
					event: "INTERNACAO",
					realized: DateTime.now(),
					complaint: data.complaint,
					expectedDischarge: data.expectedDischarge,
					diagnosis: data.diagnosis,
					prognosis: data.prognosis,
					type: HospitalizationType[data.type],
					risk: data.risk,
					technician: {
						id: authCtx.user.id,
						name: authCtx.user.name,
					},
					bed: bed
						? {
								id: bed?.id,
								name: bed?.name,
								tag: bed?.tag,
							}
						: null,
				},
			});

			return ent;
		});

		return this.show(authCtx.unit.id, ent.id);
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IHospitalizationData,
	) {
		await Database.transaction(async (trx) => {
			const hospitalization = await Hospitalization.query()
				.useTransaction(trx)
				.where("id", id)
				.preload("patient")
				.preload("bed")
				.first();

			if (
				!hospitalization ||
				hospitalization.business_unit_id !== authCtx.unit.id
			) {
				throw this.sharedService.ResourceNotFound();
			}

			const updatedHospitalization = await hospitalization
				.merge({
					type: data.type,
					risk: data.risk,
					complaint: data.complaint,
					expectedDischarge: data.expectedDischarge,
					diagnosis: data.diagnosis,
					prognosis: data.prognosis,
					status: data.status,
					patient_id: data.patientId,
					tutor_id: data.tutorId,
					bed_id: data.bedId,
					technician_id: data.userId ?? authCtx.user.id,
					releasedAt:
						data.status === HospitalizationStatus.COMPLETE
							? DateTime.now()
							: undefined,
				})
				.useTransaction(trx)
				.save();

			const hospitalizationTimeline = await TimelineType.firstOrCreate(
				{
					description: "Hospitalização",
					system_id: authCtx.system.id,
				},
				{
					description: "Hospitalização",
					color: "#000",
					requiresObservation: false,
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);

			if (data.status === HospitalizationStatus.COMPLETE) {
				const timelineInfo = await TimelineType.findOrFail(
					hospitalizationTimeline.id,
					{
						client: trx,
					},
				);

				await AnimalTimeline.create({
					timeline_id: hospitalizationTimeline.id,
					timeline_type: {
						description: timelineInfo.description,
						color: timelineInfo.color,
						requires_observation: timelineInfo.requiresObservation,
					},
					timeline_info: {
						tag: hospitalization.id,
						hospitalization: {
							id: updatedHospitalization.id,
							type: updatedHospitalization.type,
						},
						complaint: updatedHospitalization.complaint,
						bed: {
							id: updatedHospitalization.bed?.id,
							name: updatedHospitalization.bed?.name,
							tag: updatedHospitalization.bed?.tag,
						},
						hospitalizedAt: updatedHospitalization.createdAt,
						releasedAt: updatedHospitalization.releasedAt,
						deathAt: updatedHospitalization.deathAt,
						completedAt: DateTime.now(),
						technician: {
							id: authCtx.user.id,
							name: authCtx.user.name,
						},
					},
				});

				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: authCtx.group.id,
						unit: authCtx.unit.id,
						origin: "hospitalization_completed",
					},
					data: {
						tutor: {
							id: hospitalization.tutor.id,
							name: hospitalization.tutor.name,
						},
						patient: {
							id: hospitalization.patient.id,
							name: hospitalization.patient.name,
						},
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						completedAt: DateTime.now(),
						technician: {
							id: authCtx.user.id,
							name: authCtx.user.name,
						},
					},
				});

				await HospitalizationTimeline.updateMany(
					{
						"meta.hospitalization": hospitalization.id,
						"meta.type": "begin_hospitalization",
					},
					{
						$set: {
							"data.releasedAt": DateTime.now(),
							"data.finishedAt": DateTime.now(),
						},
					},
				);
			}
		});

		return this.show(authCtx.unit.id, id);
	}

	public async destroy(unitId: string, id: string) {
		const hospitalization = await Hospitalization.find(id);

		if (!hospitalization || hospitalization.business_unit_id !== unitId) {
			throw this.sharedService.ResourceNotFound();
		}

		await hospitalization.softDelete();
	}

	public async completeHospitalization(unitId: string, id: string, user: User) {
		const group = await this.sharedService.getUserGroup(unitId);

		await Database.transaction(async (trx) => {
			const hospitalization = await Hospitalization.query()
				.useTransaction(trx)
				.where("business_unit_id", unitId)
				.where("id", id)
				.preload("patient")
				.preload("bed")
				.preload("tutor")
				.first();

			if (!hospitalization) {
				throw this.sharedService.ResourceNotFound();
			}

			if (hospitalization.status === HospitalizationStatus.COMPLETE) {
				throw new BadRequestException(
					"Internação já finalizada",
					400,
					"E_CLOSED_ALREADY",
				);
			}

			await hospitalization
				.merge({
					finishedAt: DateTime.now(),
					status: HospitalizationStatus.COMPLETE,
				})
				.useTransaction(trx)
				.save();

			await HospitalizationMedicalPrescription.query()
				.useTransaction(trx)
				.where("hospitalization_id", hospitalization.id)
				.where("status", "Aberto" as THospitalizationMedicalPrescriptionStatus)
				.update({
					status: "Interrompido" as THospitalizationMedicalPrescriptionStatus,
				});

			await HospitalizationTimeline.updateMany(
				{
					"meta.hospitalization": hospitalization.id,
					"meta.type": "begin_hospitalization",
				},
				{
					$set: {
						"data.releasedAt": DateTime.now(),
						"data.finishedAt": DateTime.now(),
					},
				},
			);

			await HospitalizationMedicalPrescriptionScheduling.query()
				.useTransaction(trx)
				.where("hospitalization_id", hospitalization.id)
				.where(
					"status",
					"Aberto" as THospitalizationMedicalPrescriptionSchedulingStatus,
				)
				.update({
					status:
						"Interrompido" as THospitalizationMedicalPrescriptionSchedulingStatus,
				});

			await HospitalizationTimeline.create({
				meta: {
					hospitalization: hospitalization.id,
					group: group.id,
					unit: unitId,
					origin: "hospitalization_completed",
				},
				data: {
					tutor: {
						id: hospitalization.tutor.id,
						name: hospitalization.tutor.name,
					},
					patient: {
						id: hospitalization.patient.id,
						name: hospitalization.patient.name,
					},
					type: HospitalizationType[hospitalization.type],
					hospitalizedAt: hospitalization.createdAt,
					completedAt: DateTime.now(),
					observation: "",
					technician: {
						id: user.id,
						name: user.name,
					},
				},
			});

			// const attendanceTimelineInfo = await TimelineType.findOrFail(
			//   ATTENDANCE_UUID,
			//   {
			//     client: trx,
			//   },
			// );

			// await AnimalTimeline.create({
			//   timeline_id: ATTENDANCE_UUID,
			//   timeline_type: {
			//     description: attendanceTimelineInfo.description,
			//     color: attendanceTimelineInfo.color,
			//     requires_observation: attendanceTimelineInfo.requiresObservation,
			//   },
			//   timeline_info: {
			//     tag: updatedHospitalization.patient_id,
			//     event: 'ALTA',
			//     realized: DateTime.now(),
			//     complaint: updatedHospitalization.complaint,
			//     expectedDischarge: updatedHospitalization.expectedDischarge,
			//     diagnosis: updatedHospitalization.diagnosis,
			//     prognosis: updatedHospitalization.prognosis,
			//     technician: {
			//       id: user.id,
			//       name: user.name,
			//     },
			//   },
			// });
		});
	}

	public async getHospitalizationScheduling(authCtx: AuthContext, id: string) {
		const hospitalization = await Hospitalization.query()
			.where("id", id)
			.where("business_unit_id", authCtx.unit.id)
			.preload("bed")
			.preload("tutor", (query) => {
				query.preload("tutor");
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("hair");
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});

				query.preload("tutor");
			})
			.preload("medicalPrescriptions", (query) => {
				query.orderBy("execution_start", "desc");

				query.preload("user");
				query.preload("scheduling", (query) => {
					query.orderBy("scheduled_at", "asc");

					query.preload("executionUser");
					query.preload("technician");
					query.preload("prescription");
				});
			})
			.first();

		if (!hospitalization) {
			throw this.sharedService.ResourceNotFound();
		}

		return {
			id: hospitalization.id,
			type: HospitalizationTypeDescription[hospitalization.type],
			expectedDischarge: hospitalization.expectedDischarge,
			createdAt: hospitalization.createdAt,
			bed: hospitalization.bed
				? {
						id: hospitalization.bed.id,
						tag: hospitalization.bed.tag,
						name: hospitalization.bed.name,
					}
				: null,
			tutor: hospitalization.tutor
				? {
						id: hospitalization.tutor.id,
						name: hospitalization.tutor.name,
						cellphone: hospitalization.tutor.tutor.cellphone,
						telephone: hospitalization.tutor.tutor.telephone,
					}
				: null,
			patient: {
				id: hospitalization.patient.id,
				tag: hospitalization.patient.tag,
				name: hospitalization.patient.name,
				document: hospitalization.patient?.tutor?.document ?? null,
				info: hospitalization.patient.patientAnimal
					? {
							race: hospitalization.patient.patientAnimal.race.description,
							specie:
								hospitalization.patient.patientAnimal.race.specie.description,
							hair:
								hospitalization.patient.patientAnimal?.hair?.description ??
								null,
							age: hospitalization.patient.birthDate
								? DateTime.now()
										.diff(
											DateTime.fromJSDate(hospitalization.patient.birthDate),
											"years",
										)
										.toObject().years
								: null,
							weight: hospitalization.patient.weight ?? null,
							weightDate: hospitalization.patient.weightDate ?? null,
						}
					: null,
			},
			prescriptions: hospitalization.medicalPrescriptions,
		};
	}
}
