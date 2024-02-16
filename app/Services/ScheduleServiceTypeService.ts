import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import ScheduleServiceGroup from "App/Models/ScheduleServiceGroup";
import ScheduleServiceType from "App/Models/ScheduleServiceType";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IScheduleServiceTypeData from "Contracts/interfaces/IScheduleServiceTypeData";
import { v4 } from "uuid";

interface ISearch {
	group?: string;
	description?: string;
}

@inject()
export default class ScheduleServiceTypeService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(
		authCtx: AuthContext,
		data: ISearch,
	): Promise<Array<ScheduleServiceType>> {
		return ScheduleServiceType.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("description", "ilike", `%${data.description ?? ""}%`)
			.where("active", true)
			.where("system_id", authCtx.system.id)
			.whereHas("serviceGroup", (qb) => {
				qb.where("description", "ilike", `%${data.group ?? ""}%`).whereRaw(
					"(economic_group_id = ? or economic_group_id is null)",
					[authCtx.group.id],
				);
			})
			.preload("serviceGroup")
			.preload("product");
	}

	public async index2(authCtx: AuthContext, _: ISearch) {
		const rows = await Database.from("schedule_service_types")
			.select(
				Database.raw(`'Agenda'                            as tipo,
       schedule_service_groups.description as schedule_service_group,
       null                                as productivity_item_id,
       schedule_service_types.id           as service_id,
       schedule_service_types.description  as service_description,
       schedule_service_types.type         as service_type,
       reserved_minutes,
       allow_return,
       resume`),
			)
			.joinRaw(
				`join "schedule_service_groups" on schedule_service_types.schedule_service_group_id = schedule_service_groups.id`,
			)
			.where("schedule_service_types.active", true)
			.where("schedule_service_groups.active", true)
			.where("schedule_service_types.system_id", authCtx.system.id)
			.whereNull("schedule_service_types.deleted_at")
			.whereNull("schedule_service_groups.deleted_at")
			.where("schedule_service_groups.system_id", authCtx.system.id)
			.whereRaw(
				`(schedule_service_groups.economic_group_id = ? or schedule_service_groups.economic_group_id is null)`,
				[authCtx.group.id],
			)
			.orderByRaw("1, 2, 5");

		const map: Record<string, Record<string, unknown[]>> = {};

		for (const row of rows) {
			const firstKey = row.tipo as string;
			const secondKey = row.schedule_service_group as string;

			if (!map[firstKey]) {
				map[firstKey] = {};
			}

			if (!map[firstKey][secondKey]) {
				map[firstKey][secondKey] = [];
			}

			map[firstKey][secondKey].push(row);
		}

		return map;
	}

	public async show(
		authCtx: AuthContext,
		id: string,
	): Promise<ScheduleServiceType> {
		const qb = ScheduleServiceType.query()
			.where("id", id)
			.where("system_id", authCtx.system.id);

		const type = await qb.first();
		if (!type) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return type;
	}

	public async store(
		authCtx: AuthContext,
		data: Omit<IScheduleServiceTypeData, "active">,
	): Promise<ScheduleServiceType> {
		const serviceGroup = await ScheduleServiceGroup.findOrFail(
			data.scheduleServiceGroupId,
		);

		return serviceGroup.related("types").create({
			id: v4(),
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			description: data.description,
			reservedMinutes: data.reservedMinutes,
			product_id: data.productId,
			allowReturn: data.allowReturn,
			active: true,
			resume: data.resume,
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IScheduleServiceTypeData,
	): Promise<ScheduleServiceType> {
		const schedule = await ScheduleServiceType.query()
			.where("id", id)
			.where("system_id", authCtx.system.id)
			.first();

		if (!schedule) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (
			schedule.economic_group_id &&
			schedule.economic_group_id !== authCtx.group.id
		) {
			throw this.sharedService.SystemResource();
		}

		return schedule
			.merge({
				active: data.active,
				reservedMinutes: data.reservedMinutes,
				schedule_service_group_id: data.scheduleServiceGroupId,
				description: data.description,
				product_id: data.productId,
				allowReturn: data.allowReturn,
				resume: data.resume,
			})
			.save();
	}

	public async destroy(authCtx: AuthContext, id: string): Promise<void> {
		const schedule = await ScheduleServiceType.query()
			.where("id", id)
			.where("system_id", authCtx.system.id)
			.first();

		if (!schedule) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (
			schedule.economic_group_id &&
			schedule.economic_group_id !== authCtx.group.id
		) {
			throw this.sharedService.SystemResource();
		}

		await schedule.softDelete();
	}
}
