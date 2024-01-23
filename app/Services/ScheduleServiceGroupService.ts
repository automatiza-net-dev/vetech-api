import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import ScheduleServiceGroup from "App/Models/ScheduleServiceGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IScheduleServiceGroupData from "Contracts/interfaces/IScheduleServiceGroupData";

interface ISearch {
	description?: string;
}

@inject()
export default class ScheduleServiceGroupService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(
		authCtx: AuthContext,
		data: ISearch,
	): Promise<Array<ScheduleServiceGroup>> {
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
			.preload("types")
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
