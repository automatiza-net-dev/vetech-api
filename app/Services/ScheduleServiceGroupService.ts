import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import ScheduleServiceGroup from "App/Models/ScheduleServiceGroup";
import ScheduleServiceType from "App/Models/ScheduleServiceType";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IScheduleServiceGroupData from "Contracts/interfaces/IScheduleServiceGroupData";

interface ISearch {
	description?: string;
	patient?: string;
}

@inject()
export default class ScheduleServiceGroupService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		if (authCtx.unit.unitConfig.showTreatmentExecutionsSchedule) {
			if (!data.patient) {
				throw new BadRequestException(
					"É preciso informar o paciente",
					400,
					"E_ERR",
				);
			}

			const procedureScheduleServiceType = await ScheduleServiceType.query()
				.where("system_id", authCtx.system.id)
				.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
					authCtx.group.id,
				])
				.where("active", true)
				.where("type", "P")
				.first();
			if (!procedureScheduleServiceType) {
				throw new InternalErrorException(
					"Agendamento de tipo 'P' não foi encontrado",
					500,
					"E_ERR",
				);
			}

			return Database.from("schedule_service_groups")
				.select(
					Database.raw(`'Agenda' as tipo_registro,
       schedule_service_groups.id,
       schedule_service_groups.description,
       schedule_service_groups."type",
       schedule_service_groups.economic_group_id,
       schedule_service_groups.created_at,
       schedule_service_types.id,
       schedule_service_types.description,
       schedule_service_types.economic_group_id,
       schedule_service_types.active,
       schedule_service_types.allow_return,
       schedule_service_types.reserved_minutes,
       schedule_service_types.product_id,
       schedule_service_types.resume,
       schedule_service_types.type,
       schedule_service_types.updated_at,
       schedule_service_types.created_at,
       null     as treatment_id,
       null     as treatment_item_id,
       null     as treatment_execution_id`),
				)
				.joinRaw(
					`join schedule_service_types
              on schedule_service_groups.id = schedule_service_types.schedule_service_group_id and
                 schedule_service_groups.system_id = schedule_service_types.system_id and
                 schedule_service_types.deleted_at is null and
                 schedule_service_types.active = true and schedule_service_types."type" = 'A'
                  and (schedule_service_types.economic_group_id is null or
                       schedule_service_types.economic_group_id = ?)`,
					[authCtx.group.id],
				)
				.where("schedule_service_groups.system_id", authCtx.system.id)
				.whereRaw(
					"(schedule_service_groups.economic_group_id is null or schedule_service_groups.economic_group_id = ?)",
					[authCtx.group.id],
				)
				.where("schedule_service_groups.active", true)
				.whereNull("schedule_service_groups.deleted_at")
				.union((qb) => {
					qb.from("treatment_executions")
						.select(
							Database.raw(
								`'Tratamento',
       null::uuid,
       'Tratamentos - Execuções',
       null,
       null,
       null,
       ?,
       products.description || ' - ' || productivity_items.description,
       null,
       null,
       false,
       productivity_items.reserved_minutes,
       product_variations.product_id,
       null,
       'E',
       null,
       null,
       treatment_executions.treatment_id,
       treatment_executions.treatment_item_id,
       treatment_executions.id`,
								[procedureScheduleServiceType.id],
							),
						)
						.joinRaw(
							"join productivity_items on treatment_executions.productivity_item_id = productivity_items.id",
						)
						.joinRaw(
							`join (treatment_items join product_variations on product_variations.id = treatment_items.product_variation_id join products
               on product_variations.product_id = products.id)
              on treatment_executions.treatment_item_id = treatment_items.id and
                 treatment_executions.treatment_id = treatment_items.treatment_id`,
						)
						.joinRaw(
							"join treatments on treatment_executions.treatment_id = treatments.id",
						)
						.where("treatments.client_id", data.patient ?? "")
						.whereNull("treatment_executions.schedule_id")
						.orderByRaw("1, 4, 3, 14, 7, 8");
				});
		}

		const qb = ScheduleServiceGroup.query()
			.preload("types", (query) => {
				query
					.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
						authCtx.group.id,
					])
					.where("system_id", authCtx.system.id);
			})
			.where("active", true)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id);

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		return qb;
	}

	public async show(
		authCtx: AuthContext,
		id: string,
	): Promise<ScheduleServiceGroup> {
		const model = await ScheduleServiceGroup.query()
			.where("id", id)
			.where("system_id", authCtx.system.id)
			.preload("types", (query) => {
				query
					.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
						authCtx.group.id,
					])
					.where("system_id", authCtx.system.id);
			})
			.first();

		const exception = new ResourceNotFoundException(
			"Recurso não encontrado",
			404,
			"E_NOT_FOUND",
		);

		if (!model) throw exception;

		return model;
	}

	public async store(
		authCtx: AuthContext,
		data: Omit<IScheduleServiceGroupData, "active">,
	): Promise<ScheduleServiceGroup> {
		return ScheduleServiceGroup.create({
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			description: data.description,
			type: data.type,
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IScheduleServiceGroupData,
	): Promise<ScheduleServiceGroup> {
		const model = await this.show(authCtx, id);

		if (!model.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		return model.merge(data).save();
	}

	public async destroy(authCtx: AuthContext, id: string): Promise<void> {
		const model = await this.show(authCtx, id);

		if (!model.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		await model.softDelete();
	}
}
