import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import ScheduleServiceGroup from "App/Models/ScheduleServiceGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IScheduleServiceGroupData from "Contracts/interfaces/IScheduleServiceGroupData";
import { v4 } from "uuid";

type IndexResult = {
	schedule_service_group_id: string;
	schedule_service_group_description: string;
	schedule_service_group_type: string | null;
	types: {
		schedule_service_type_id: string;
		schedule_service_type_description: string;
		schedule_service_type_type: string;
		reserved_minutes: number;
		allow_return: boolean;
		product_id: string | null;
		resume: string | null;
	}[];
};

interface ISearch {
	description?: string;
	patient?: string;
}

@inject()
export default class ScheduleServiceGroupService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		// if (!data.patient) {
		// 	throw new BadRequestException(
		// 		"É preciso informar o paciente",
		// 		400,
		// 		"E_ERR",
		// 	);
		// }

		const result: {
			ordem: number;
			schedule_service_group_id: string;
			schedule_service_group_description: string;
			schedule_service_group_type: string;
			schedule_service_type_id: string;
			schedule_service_type_description: string;
			schedule_service_type_type: string;
			reserved_minutes: number;
			allow_return: boolean;
			product_id: string;
			resume: string;
		}[] = await Database.from("schedule_service_groups")
			.select(
				Database.raw(`1                                   as ordem,
       schedule_service_groups.id          as schedule_service_group_id,
       schedule_service_groups.description as schedule_service_group_description,
       schedule_service_groups.type        as schedule_service_group_type,
       schedule_service_types.id           as schedule_service_type_id,
       schedule_service_types.description  as schedule_service_type_description,
       schedule_service_types.type         as schedule_service_type_type,
       schedule_service_types.reserved_minutes,
       schedule_service_types.allow_return,
       schedule_service_types.product_id,
       schedule_service_types.resume`),
			)
			.joinRaw(`join schedule_service_types
              on schedule_service_groups.id = schedule_service_types.schedule_service_group_id and
                 schedule_service_groups.system_id = schedule_service_types.system_id
                  and schedule_service_groups.active = true and schedule_service_types.active = true and
                 schedule_service_groups.deleted_at is null and schedule_service_types.deleted_at is null`)
			.whereRaw(
				`schedule_service_groups.system_id = ?
  and (schedule_service_groups.economic_group_id = ?
    or schedule_service_groups.economic_group_id is null)
  and (schedule_service_types.economic_group_id = ?
    or schedule_service_types.economic_group_id is null)`,
				[authCtx.system.id, authCtx.group.id, authCtx.group.id],
			)
			.whereRaw(
				authCtx.unit.unitConfig.showTreatmentExecutionsSchedule
					? `schedule_service_types."type" = 'A'`
					: "",
			)
			.union((builder) => {
				builder
					.from("treatments")
					.select(
						Database.raw(`2                           as ordem,
       null                        as schedule_service_group_id,
       'Tratamentos'               as schedule_service_group_description,
       'T'                         as schedule_service_group_type,
       schedule_service_types.id   as schedule_service_type_id,
       schedule_service_types.description || ' - (' || count(treatment_executions.id) ||
       ')'                         as schedule_service_type_description,
       schedule_service_types.type as schedule_service_type_type,
       schedule_service_types.reserved_minutes,
       false                       as allow_return,
       schedule_service_types.product_id,
       schedule_service_types.resume`),
					)
					.joinRaw(`join treatment_items
              on treatments.id = treatment_items.treatment_id`)
					.joinRaw(`join treatment_executions
              on treatment_items.treatment_id = treatment_executions.treatment_id and
                 treatment_items.id = treatment_executions.treatment_item_id`)
					.joinRaw(
						"join business_unit_configs on treatments.business_unit_id = business_unit_configs.business_unit_id",
					)
					.joinRaw(`join schedule_service_types
              on schedule_service_types.id = business_unit_configs.treatment_schedule_service_type_id`)
					.whereRaw("business_unit_configs.business_unit_id = ?", [
						authCtx.unit.id,
					])
					.whereRaw("treatments.client_id = ?", [data.patient ?? v4()])
					.whereRaw(
						"business_unit_configs.show_treatment_executions_schedule = true",
					);
			})
			.groupByRaw("schedule_service_types.id")
			.orderByRaw("ordem, schedule_service_group_id, schedule_service_type_id");

		const groups = SharedService.GroupBy(result, (row) => [
			JSON.stringify({
				order: row.ordem,
				group_id: row.schedule_service_group_id,
				type_id: row.schedule_service_type_id,
			}),
		]);

		return Object.keys(groups).reduce((accumulator, groupKey) => {
			const { group_id } = JSON.parse(groupKey);

			if (
				!accumulator.find((elem) => elem.schedule_service_group_id === group_id)
			) {
				const rowInfo = result.find(
					(row) => row.schedule_service_group_id === group_id,
				);

				accumulator.push({
					schedule_service_group_id: group_id,
					schedule_service_group_description:
						rowInfo?.schedule_service_group_description ?? "",
					schedule_service_group_type:
						rowInfo?.schedule_service_group_type ?? "",
					types: result
						.filter((row) => row.schedule_service_group_id === group_id)
						.map((row) => ({
							schedule_service_type_id: row.schedule_service_type_id,
							schedule_service_type_description:
								row.schedule_service_type_description,
							schedule_service_type_type: row.schedule_service_type_type,
							reserved_minutes: row.reserved_minutes,
							allow_return: row.allow_return,
							product_id: row.product_id,
							resume: row.resume,
						})),
				});
			}

			return accumulator;
		}, [] as IndexResult[]);
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
