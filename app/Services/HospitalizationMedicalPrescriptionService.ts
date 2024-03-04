import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import DrugAdministration from "App/Models/DrugAdministration";
import Hospitalization, {
	HospitalizationType,
} from "App/Models/Hospitalization";
import HospitalizationMedicalPrescription from "App/Models/HospitalizationMedicalPrescription";
import HospitalizationMedicalPrescriptionScheduling, {
	THospitalizationMedicalPrescriptionSchedulingStatus,
} from "App/Models/HospitalizationMedicalPrescriptionScheduling";
import {
	MedicalPrescriptionFluidSet,
	MedicalPrescriptionFluidSetLabel,
	MedicalPrescriptionFrequency,
	MedicalPrescriptionFrequencyQuantityUnit,
	MedicalPrescriptionFrequencyUnit,
	MedicalPrescriptionType,
} from "App/Models/MedicalPrescription";
import HospitalizationTimeline from "App/Models/mongoose/HospitalizationTimeline";
import Unit from "App/Models/Unit";
import User from "App/Models/User";
import { MedicalPrescriptionKeys } from "App/Services/MedicalPrescriptionService";
import SharedService, { AuthContext } from "App/Services/SharedService";
import CreateFluidOnceOrNeededValidator from "App/Validators/MedicalPrescription/CreateFluidOnceOrNeededValidator";
import CreateFluidRecurrentValidator from "App/Validators/MedicalPrescription/CreateFluidRecurrentValidator";
import CreateMedicationOnceOrNeededValidator from "App/Validators/MedicalPrescription/CreateMedicationOnceOrNeededValidator";
import CreateMedicationRecurrentValidator from "App/Validators/MedicalPrescription/CreateMedicationRecurrentValidator";
import CreateProcedureRecurrentValidator from "App/Validators/MedicalPrescription/CreateProcedureRecurrentValidator";
import IHospitalizationMedicalPrescriptionData, {
	IHospitalizationMedicalPrescriptionSchedulingData,
} from "Contracts/interfaces/IHospitalizationMedicalPrescriptionData";
import { differenceInMinutes, format } from "date-fns";
import { DateTime } from "luxon";

type HospitalizationMedicalPrescriptionKeys = "PR" | "MR" | "FR" | "F_" | "M_";

export const HospitalizationMedicalPrescriptionValidation: Record<
	HospitalizationMedicalPrescriptionKeys,
	unknown
> = {
	PR: CreateProcedureRecurrentValidator,
	MR: CreateMedicationRecurrentValidator,
	FR: CreateFluidRecurrentValidator,
	F_: CreateFluidOnceOrNeededValidator,
	M_: CreateMedicationOnceOrNeededValidator,
};

interface ISearch {
	hospitalization?: string;
	fromExecutionDate?: string;
	toExecutionDate?: string;
	status?: string;
}

interface ISearchScheduling {
	hospitalization?: string;
	fromScheduledDate?: string;
	toScheduledDate?: string;
}

@inject()
export default class HospitalizationMedicalPrescriptionService {
	constructor(private sharedService: SharedService) {}

	public async show(unitId: string, id: string) {
		const result = await HospitalizationMedicalPrescription.query()
			.where("id", id)
			.whereHas("hospitalization", (query) => {
				query.where("business_unit_id", unitId);
			})
			.preload("hospitalization", (query) => {
				query.select("id", "patient_id", "technician_id");
				query.preload("patient");
				query.preload("technician", (query) => {
					query.select("id", "name");
				});
			})
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("prescriptionUnit")
			.preload("fluidUnit")
			.preload("drugAdministration")
			.first();

		if (!result) {
			throw this.sharedService.ResourceNotFound();
		}

		return result;
	}

	public async index(unitId: string, data: ISearch) {
		const query = HospitalizationMedicalPrescription.query()
			.preload("hospitalization", (query) => {
				query.select("id", "patient_id", "technician_id");
				query.preload("patient");
				query.preload("technician");
			})
			.preload("user");

		if (data.hospitalization) {
			query.where("hospitalization_id", data.hospitalization);
		} else {
			const hospitalizations = await Hospitalization.query()
				.where("business_unit_id", unitId)
				.select("id");

			query.whereIn(
				"hospitalization_id",
				hospitalizations.map((h) => h.id),
			);
		}

		if (data.fromExecutionDate) {
			query.where("execution_start", ">=", new Date(data.fromExecutionDate));
		}

		if (data.toExecutionDate) {
			query.where("execution_start", "<=", new Date(data.toExecutionDate));
		}

		if (data.status) {
			query.where("status", data.status);
		}

		return query;
	}

	public async schedulingIndex(unitId: string, data: ISearchScheduling) {
		const query = HospitalizationMedicalPrescriptionScheduling.query()
			.where(
				"status",
				"Aberto" as THospitalizationMedicalPrescriptionSchedulingStatus,
			)
			.whereHas("hospitalization", (query) => {
				query.whereRaw(`(released_at is null and death_at is null)`);
			})
			.preload("hospitalization", (query) => {
				query.select("id", "patient_id", "technician_id");
				query.preload("patient");
				query.preload("technician");
			})
			.preload("technician")
			.preload("prescription");

		if (data.hospitalization) {
			query.where("hospitalization_id", data.hospitalization);
		} else {
			const hospitalizations = await Hospitalization.query()
				.where("business_unit_id", unitId)
				.select("id");

			query.whereIn(
				"hospitalization_id",
				hospitalizations.map((h) => h.id),
			);
		}

		if (data.fromScheduledDate && data.toScheduledDate) {
			const d1 = new Date(data.fromScheduledDate);
			const d2 = new Date(data.toScheduledDate);

			query.whereRaw(
				`(scheduled_at::date = ? and scheduled_at::time between ? and ?)`,
				[
					format(d1, "yyyy-MM-dd"),
					format(d1, "HH:mm:ss"),
					format(d2, "HH:mm:ss"),
				],
			);
		}

		// if (data.fromScheduledDate) {
		// 	query.where("scheduled_at", ">=", new Date(data.fromScheduledDate));
		// }
		//
		// if (data.toScheduledDate) {
		// 	query.where("scheduled_at", "<=", new Date(data.toScheduledDate));
		// }

		return query;
	}

	public async store(
		data: IHospitalizationMedicalPrescriptionData,
		body: Record<string, unknown>,
		unitId: string,
		user: User,
	) {
		const group = await this.sharedService.getUserGroup(unitId);
		const { key } = this.matchSchema(data.type, data.frequency);

		return Database.transaction(async (trx) => {
			const hospitalization = await Hospitalization.query()
				.where("id", data.hospitalizationId)
				.firstOrFail();

			const validatedData: Partial<HospitalizationMedicalPrescription> = {
				hospitalization_id: data.hospitalizationId,
				type: data.type,
				prescribedAt: data.prescribedAt,
				frequency: data.frequency,
				description: data.description,
				resume: data.resume,
				executionStart: data.executionStart,
				user_id: data.userId,
				volume: data.volume,
				status: "Aberto",
			};

			if (key === "PR") {
				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Procedimento",
						frequency: data.frequency,
						frequencyInterval: body.frequencyInterval ?? null,
						frequencyUnit: body.frequencyUnit ?? null,
						frequencyQuantity: body.frequencyQuantity ?? null,
						frequencyQuantityUnit: body.frequencyQuantityUnit ?? null,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create({
					...validatedData,
					frequencyInterval: body.frequencyInterval as number,
					frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
					frequencyQuantity: body.frequencyQuantity as number,
					frequencyQuantityUnit:
						body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
				});
			}

			if (key === "PO") {
				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Procedimento",
						frequency: data.frequency,
						frequencyInternal: body.frequencyInterval,
						frequencyQuantity: body.frequencyQuantity,
						frequencyUnit: body.frequencyUnit,
						frequencyQuantityUnit: body.frequencyQuantityUnit,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						fluidSet: body.fluidSet,
						fluidSpeed: body.fluidSpeed as number,
						dose: body.dose as number,
						supplement: body.supplement as string,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create(
					{
						...validatedData,
						dose: body.dose as number,
						prescription_unit_id: body.prescriptionUnitId as string,
						drug_administration_id: body.drugAdministrationId as string,
						fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
						fluidSpeed: body.fluidSpeed as number,
						fluid_unit_id: body.fluidUnitId as string,
						supplement: body.supplement as string,
					},
					{
						client: trx,
					},
				);
			}

			if (key === "P_") {
				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Procedimento",
						frequency: data.frequency,
						frequencyInternal: body.frequencyInterval,
						frequencyQuantity: body.frequencyQuantity,
						frequencyUnit: body.frequencyUnit,
						frequencyQuantityUnit: body.frequencyQuantityUnit,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						fluidSet: body.fluidSet,
						fluidSpeed: body.fluidSpeed as number,
						dose: body.dose as number,
						supplement: body.supplement as string,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create(
					{
						...validatedData,
						dose: body.dose as number,
						prescription_unit_id: body.prescriptionUnitId as string,
						drug_administration_id: body.drugAdministrationId as string,
						fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
						fluidSpeed: body.fluidSpeed as number,
						fluid_unit_id: body.fluidUnitId as string,
						supplement: body.supplement as string,
					},
					{
						client: trx,
					},
				);
			}

			if (key === "MR") {
				const drug = await DrugAdministration.query()
					.where("id", body.drugAdministrationId as string)
					.useTransaction(trx)
					.firstOrFail();

				const unit = await Unit.query()
					.where("id", body.prescriptionUnitId as string)
					.useTransaction(trx)
					.firstOrFail();

				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Medicamento",
						frequency: data.frequency,
						frequencyInternal: body.frequencyInterval,
						frequencyQuantity: body.frequencyQuantity,
						frequencyUnit: body.frequencyUnit,
						frequencyQuantityUnit: body.frequencyQuantityUnit,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						drug: drug.description,
						dose: body.dose as number,
						unit: unit.name,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create(
					{
						...validatedData,
						frequencyInterval: body.frequencyInterval as number,
						frequencyUnit:
							body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
						frequencyQuantity: body.frequencyQuantity as number,
						frequencyQuantityUnit:
							body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
						dose: body.dose as number,
						prescription_unit_id: body.prescriptionUnitId as string,
						drug_administration_id: body.drugAdministrationId as string,
					},
					{
						client: trx,
					},
				);
			}

			if (key === "M_") {
				const drug = await DrugAdministration.query()
					.where("id", body.drugAdministrationId as string)
					.useTransaction(trx)
					.firstOrFail();

				const unit = await Unit.query()
					.where("id", body.prescriptionUnitId as string)
					.useTransaction(trx)
					.firstOrFail();

				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Medicamento",
						frequency: data.frequency,
						frequencyInternal: body.frequencyInterval,
						frequencyQuantity: body.frequencyQuantity,
						frequencyUnit: body.frequencyUnit,
						frequencyQuantityUnit: body.frequencyQuantityUnit,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						drug: drug.description,
						dose: body.dose as number,
						unit: unit.name,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create(
					{
						...validatedData,
						dose: body.dose as number,
						prescription_unit_id: body.prescriptionUnitId as string,
						drug_administration_id: body.drugAdministrationId as string,
					},
					{
						client: trx,
					},
				);
			}

			if (key === "FR") {
				const drug = await DrugAdministration.query()
					.where("id", body.drugAdministrationId as string)
					.useTransaction(trx)
					.firstOrFail();

				const unit = await Unit.query()
					.where("id", body.prescriptionUnitId as string)
					.useTransaction(trx)
					.firstOrFail();

				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Fluidoterapia",
						frequency: data.frequency,
						frequencyInternal: body.frequencyInterval,
						frequencyQuantity: body.frequencyQuantity,
						frequencyUnit: body.frequencyUnit,
						frequencyQuantityUnit: body.frequencyQuantityUnit,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						fluidSet: body.fluidSet,
						fluidSpeed: body.fluidSpeed as number,
						drug: drug.description,
						dose: body.dose as number,
						unit: unit.name,
						supplement: body.supplement as string,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create(
					{
						...validatedData,
						frequencyInterval: body.frequencyInterval as number,
						frequencyUnit:
							body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
						frequencyQuantity: body.frequencyQuantity as number,
						frequencyQuantityUnit:
							body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
						dose: body.dose as number,
						prescription_unit_id: body.prescriptionUnitId as string,
						drug_administration_id: body.drugAdministrationId as string,
						fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
						fluidSpeed: body.fluidSpeed as number,
						fluid_unit_id: body.fluidUnitId as string,
						supplement: body.supplement as string,
					},
					{
						client: trx,
					},
				);
			}

			if (key === "F_") {
				await HospitalizationTimeline.create({
					meta: {
						hospitalization: hospitalization.id,
						group: group.id,
						unit: unitId,
						origin: "prescription",
					},
					data: {
						type: HospitalizationType[hospitalization.type],
						hospitalizedAt: hospitalization.createdAt,
						issuedAt: DateTime.now(),
						technician: {
							id: user.id,
							name: user.name,
						},
						prescription_type: "Fluidoterapia",
						frequency: data.frequency,
						frequencyInternal: body.frequencyInterval,
						frequencyQuantity: body.frequencyQuantity,
						frequencyUnit: body.frequencyUnit,
						frequencyQuantityUnit: body.frequencyQuantityUnit,
						executionStart: data.executionStart,
						description: data.description,
						resume: data.resume,
						fluidSet: body.fluidSet,
						fluidSpeed: body.fluidSpeed as number,
						dose: body.dose as number,
						supplement: body.supplement as string,
						volume: data.volume ?? null,
					},
				});

				return HospitalizationMedicalPrescription.create(
					{
						...validatedData,
						dose: body.dose as number,
						prescription_unit_id: body.prescriptionUnitId as string,
						drug_administration_id: body.drugAdministrationId as string,
						fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
						fluidSpeed: body.fluidSpeed as number,
						fluid_unit_id: body.fluidUnitId as string,
						supplement: body.supplement as string,
					},
					{
						client: trx,
					},
				);
			}

			throw new BadRequestException(
				"Combinação de tipo e frequência inválida",
				400,
				"E_INVALID",
			);

			// await HospitalizationTimeline.create({
			//   meta: {
			//     hospitalization: hospitalization.id,
			//     group: group.id,
			//     unit: unitId,
			//   },
			//   type: HospitalizationType[hospitalization.type],
			//   hospitalizedAt: hospitalization.createdAt,
			//   realizedAt: data.executedAt,
			//   issuedAt: DateTime.now(),
			//   technician: {
			//     id: user.id,
			//     name: user.name,
			//   },
			//   attachments: ent.attachments.map(a => a.attachment),
			// });
		});
	}

	public async update(
		id: string,
		user: User,
		data: IHospitalizationMedicalPrescriptionData,
		body: Record<string, unknown>,
	) {
		const entity = await HospitalizationMedicalPrescription.query()
			.where("id", id)
			.where("hospitalization_id", data.hospitalizationId)
			.first();

		if (!entity) {
			throw this.sharedService.ResourceNotFound();
		}

		if (["E", "I", "C"].includes(entity.status)) {
			throw new BadRequestException(
				"Prescrição em estado inválido",
				400,
				"E_INVALID",
			);
		}

		const { key } = this.matchSchema(data.type, data.frequency);

		entity.merge({
			update_user_id: user.id,
			status: "Executado",
			type: data.type,
			prescribedAt: data.prescribedAt,
			frequency: data.frequency,
			description: data.description,
			resume: data.resume,
			executionStart: data.executionStart,
			user_id: data.userId,
			observationOnExecution: data.observationOnExecution,
			volume: data.volume,
		});

		if (key === "PR") {
			entity.merge({
				frequencyInterval: body.frequencyInterval as number,
				frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
				frequencyQuantity: body.frequencyQuantity as number,
				frequencyQuantityUnit:
					body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
			});
		}

		if (key === "MR") {
			entity.merge({
				frequencyInterval: body.frequencyInterval as number,
				frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
				frequencyQuantity: body.frequencyQuantity as number,
				frequencyQuantityUnit:
					body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
				dose: body.dose as number,
				prescription_unit_id: body.prescriptionUnitId as string,
				drug_administration_id: body.drugAdministrationId as string,
			});
		}

		if (key === "M_") {
			entity.merge({
				dose: body.dose as number,
				prescription_unit_id: body.prescriptionUnitId as string,
				drug_administration_id: body.drugAdministrationId as string,
			});
		}

		if (key === "FR") {
			entity.merge({
				frequencyInterval: body.frequencyInterval as number,
				frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
				frequencyQuantity: body.frequencyQuantity as number,
				frequencyQuantityUnit:
					body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
				dose: body.dose as number,
				prescription_unit_id: body.prescriptionUnitId as string,
				drug_administration_id: body.drugAdministrationId as string,
				fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
				fluidSpeed: body.fluidSpeed as number,
				fluid_unit_id: body.fluidUnitId as string,
				supplement: body.supplement as string,
			});
		}

		if (key === "F_") {
			entity.merge({
				dose: body.dose as number,
				prescription_unit_id: body.prescriptionUnitId as string,
				drug_administration_id: body.drugAdministrationId as string,
				fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
				fluidSpeed: body.fluidSpeed as number,
				fluid_unit_id: body.fluidUnitId as string,
				supplement: body.supplement as string,
			});
		}

		return entity.save();
	}

	public async interruptPrescription(authCtx: AuthContext, id: string) {
		await Database.transaction(async (trx) => {
			const entity = await HospitalizationMedicalPrescription.query()
				.useTransaction(trx)
				.where("id", id)
				.first();

			if (!entity) {
				throw this.sharedService.ResourceNotFound();
			}

			if (entity.status !== "Aberto") {
				throw new BadRequestException(
					"Prescrição não está ativa",
					400,
					"E_INVALID",
				);
			}

			await entity
				.merge({
					status: "Interrompido",
					active: false,
					excludedAt: DateTime.now(),
					update_user_id: authCtx.user.id,
				})
				.useTransaction(trx)
				.save();

			await entity
				.related("scheduling")
				.query()
				.useTransaction(trx)
				.where("status", "A")
				.update({
					status: "I",
					excludedAt: DateTime.now(),
					update_user_id: authCtx.user.id,
				});
		});
	}

	public async excludePrescription(authCtx: AuthContext, id: string) {
		await Database.transaction(async (trx) => {
			const entity = await HospitalizationMedicalPrescription.query()
				.useTransaction(trx)
				.where("id", id)
				.preload("scheduling")
				.first();

			if (!entity) {
				throw this.sharedService.ResourceNotFound();
			}

			if (entity.status !== "Aberto") {
				throw new BadRequestException(
					"Prescrição não está ativa",
					400,
					"E_INVALID",
				);
			}

			if (entity.scheduling.some((s) => s.status !== "Aberto")) {
				throw new BadRequestException(
					'Esta Prescrição Médica não pode ser excluída pois já possui execuções de Agendamentos. Utilize a opção "Interromper Prescrição Médica"',
					400,
					"E_INVALID",
				);
			}

			await entity
				.merge({
					status: "Cancelado",
					active: false,
					excludedAt: DateTime.now(),
					update_user_id: authCtx.user.id,
				})
				.useTransaction(trx)
				.save();

			await entity.related("scheduling").query().useTransaction(trx).update({
				status: "C",
				excludedAt: DateTime.now(),
				update_user_id: authCtx.user.id,
			});
		});
	}

	public async updateScheduling(
		id: string,
		user: User,
		data: IHospitalizationMedicalPrescriptionSchedulingData,
	) {
		await Database.transaction(async (trx) => {
			const scheduling =
				await HospitalizationMedicalPrescriptionScheduling.query()
					.useTransaction(trx)
					.where("id", id)
					.preload("hospitalization")
					.preload("prescription")
					.first();

			if (!scheduling) {
				throw this.sharedService.ResourceNotFound();
			}

			if (
				scheduling.status !==
					("Aberto" as THospitalizationMedicalPrescriptionSchedulingStatus) ||
				scheduling.executedAt
			) {
				throw new BadRequestException("Agendamento já executado", 400, "E_ERR");
			}

			await scheduling
				.merge({
					description: data.description,
					resume: data.resume,
					executedAt: DateTime.now(),
					scheduledAt: data.scheduledAt,
					prescribedAt: data.executedAt,
					status: data.status,
					type: data.type,
					frequency: data.frequency,
					user_id: user.id,
					update_user_id: user.id,
					execution_user_id: data.executionUserId,
				})
				.useTransaction(trx)
				.save();

			const prescriptionSchedulings =
				await HospitalizationMedicalPrescriptionScheduling.query()
					.useTransaction(trx)
					.where(
						"hospitalization_medical_prescription_id",
						scheduling.hospitalization_medical_prescription_id,
					);

			await scheduling.prescription
				.merge({
					status: prescriptionSchedulings.every((p) => p.status === "Executado")
						? "Executado"
						: "Aberto",
				})
				.useTransaction(trx)
				.save();

			await HospitalizationTimeline.create({
				meta: {
					hospitalization: scheduling.hospitalization_id,
					group: scheduling.hospitalization.economic_group_id,
					unit: scheduling.hospitalization.business_unit_id,
					origin: "scheduling_execution",
				},
				data: {
					type: HospitalizationType[scheduling.hospitalization.type],
					hospitalizedAt: scheduling.hospitalization.createdAt,
					scheduledAt: data.scheduledAt,
					executedAt: data.executedAt,
					issuedAt: DateTime.now(),
					technician: {
						id: user.id,
						name: user.name,
					},
					description: data.description,
					resume: data.resume,
					prescription: scheduling.prescription.description,
					prescription_type: data.type,
				},
			});
		});
	}

	public async delete(id: string) {
		const entity = await HospitalizationMedicalPrescription.query()
			.where("id", id)
			.first();

		if (!entity) {
			throw this.sharedService.ResourceNotFound();
		}

		await entity.softDelete();
	}

	matchSchema(
		type: MedicalPrescriptionType,
		frequency: MedicalPrescriptionFrequency,
	): { key: MedicalPrescriptionKeys } {
		if (type === MedicalPrescriptionType.PROCEDURE) {
			// b)
			if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
				return { key: "PR" } as const;
			}

			if (frequency === MedicalPrescriptionFrequency.ONCE) {
				return { key: "PO" } as const;
			}

			return { key: "P_" } as const;
		}

		if (type === MedicalPrescriptionType.MEDICATION) {
			// c)
			if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
				return { key: "MR" } as const;
			}

			// d)
			return { key: "M_" } as const;
		}

		// e)
		if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
			return { key: "FR" } as const;
		}

		// f)
		return { key: "F_" } as const;
	}

	async createScheduling(
		prescription: HospitalizationMedicalPrescription,
		user: User,
	) {
		await prescription.load("hospitalization");

		const resume = await this.createResume(prescription);

		if (prescription.frequency === MedicalPrescriptionFrequency.WHEN_NEEDED) {
			await prescription.related("scheduling").create({
				type: prescription.type,
				frequency: prescription.frequency,
				resume,
				hospitalization_id: prescription.hospitalization_id,
				status: "Aberto",
				user_id: user.id,
			});
			return;
		}

		if (prescription.frequency === MedicalPrescriptionFrequency.ONCE) {
			await prescription.related("scheduling").create({
				type: prescription.type,
				frequency: prescription.frequency,
				resume,
				scheduledAt: prescription.executionStart,
				hospitalization_id: prescription.hospitalization_id,
				status: "Aberto",
				user_id: user.id,
			});

			return;
		}

		const offset =
			prescription.frequencyUnit === MedicalPrescriptionFrequencyUnit.DAY
				? 60 * 24
				: 60;

		const diff =
			differenceInMinutes(
				this.calculateEndDate(prescription),
				prescription.prescribedAt.toJSDate(),
			) /
			offset /
			prescription.frequencyInterval;

		const data: Array<Partial<HospitalizationMedicalPrescriptionScheduling>> =
			Array.from<Partial<HospitalizationMedicalPrescriptionScheduling>>({
				length: Math.ceil(diff),
			}).map((_, index) => {
				const scheduledAt =
					prescription.frequencyUnit === MedicalPrescriptionFrequencyUnit.HOUR
						? prescription.executionStart.plus({
								hours: prescription.frequencyInterval * index,
						  })
						: prescription.executionStart.plus({
								days: prescription.frequencyInterval * index,
						  });

				return {
					type: prescription.type,
					frequency: prescription.frequency,
					resume,
					scheduledAt,
					status: "Aberto",
					hospitalization_id: prescription.hospitalization_id,
					user_id: user.id,
				};
			});

		await prescription.related("scheduling").createMany(data);
	}

	async createResume(prescription: HospitalizationMedicalPrescription) {
		if (prescription.type === MedicalPrescriptionType.PROCEDURE) {
			return prescription.description;
		}

		await prescription.load("drugAdministration");
		await prescription.load("prescriptionUnit");
		await prescription.load("hospitalization");
		await prescription.load("hospitalization", (query) => {
			query.preload("patient");
		});

		if (prescription.type === MedicalPrescriptionType.MEDICATION) {
			return [
				prescription.description,
				[prescription?.dose, prescription?.prescriptionUnit?.name]
					.filter(Boolean)
					.join(" "),
				prescription.volume && `volume: ${prescription.volume}`,
				prescription.drugAdministration?.description &&
					`via de aplicação: ${
						prescription.drugAdministration?.description ?? "-"
					}`,
				`(${prescription.hospitalization.patient.weight ?? ""} ${
					prescription.hospitalization.patient.weightDate
						? [
								"kg em ",
								format(
									prescription.hospitalization.patient.weightDate?.toJSDate(),
									"dd/MM/yyyy HH:mm",
								),
						  ].join(" ")
						: "Não informado"
				})`,
			]
				.filter(Boolean)
				.join(", ");
		}

		await prescription.load("fluidUnit");

		return [
			prescription.description,
			prescription.dose &&
				prescription.prescriptionUnit &&
				`${prescription.dose} ${prescription.prescriptionUnit.name}`,
			prescription.volume && `volume: ${prescription.volume}`,
			prescription.drugAdministration &&
				`via aplicação: ${prescription.drugAdministration.description}`,
			MedicalPrescriptionFluidSetLabel[prescription.fluidSet] ?? null,
			prescription.fluidUnit &&
				prescription.fluidUnit &&
				`${prescription.fluidSpeed} ${prescription.fluidUnit?.name}`,
			prescription.supplement,
		]
			.filter(Boolean)
			.join(", ");
	}

	calculateEndDate(prescription: HospitalizationMedicalPrescription) {
		if (
			prescription.frequencyQuantityUnit ===
			MedicalPrescriptionFrequencyQuantityUnit.DAY
		) {
			return prescription.prescribedAt
				.plus({ days: prescription.frequencyQuantity })
				.toJSDate();
		}

		if (
			prescription.frequencyQuantityUnit ===
			MedicalPrescriptionFrequencyQuantityUnit.HOUR
		) {
			return prescription.prescribedAt
				.plus({ hours: prescription.frequencyQuantity })
				.toJSDate();
		}

		return prescription.prescribedAt.toJSDate();
	}
}
