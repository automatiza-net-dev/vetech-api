import { inject } from "@adonisjs/fold";
import AccountPlanGroup from "App/Models/AccountPlanGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IAccountPlanGroupData from "Contracts/interfaces/IAccountPlanGroupData";

interface ISearch {
	description?: string;
	type?: string;
}
@inject()
export default class AccountPlanGroupService {
	constructor(private sharedService: SharedService) {}

	async index(authCtx: AuthContext, data: ISearch) {
		const qb = AccountPlanGroup.query()
			.preload("dreGroup", (query) => {
				query.select("id", "description");
			})
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			]);

		if (data.description) {
			qb.whereILike("description", `%${data.description}%`);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		return qb;
	}

	async store(
		authCtx: AuthContext,
		data: Omit<IAccountPlanGroupData, "active">,
	) {
		return AccountPlanGroup.create({
			economic_group_id: authCtx.group.id,
			dre_group_id: data.dreGroupId,
			description: data.description,
			type: data.type,
			system_id: authCtx.system.id,
		});
	}

	async show(authCtx: AuthContext, id: number) {
		const model = await AccountPlanGroup.query()
			.preload("dreGroup", (query) => {
				query.select("id", "description");
			})
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("id", id)
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		return model;
	}

	async update(authCtx: AuthContext, id: number, data: IAccountPlanGroupData) {
		const model = await AccountPlanGroup.query()
			.where("economic_group_id", authCtx.group.id)
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		if (!model.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		return model
			.merge({
				dre_group_id: data.dreGroupId,
				description: data.description,
				type: data.type,
				active: data.active,
			})
			.save();
	}

	async remove(authCtx: AuthContext, id: number) {
		const model = await AccountPlanGroup.query()
			.where("system_id", authCtx.system.id)
			.where("economic_group_id", authCtx.group.id)
			.where("id", id)
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		if (!model.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		await model.delete();
	}
}
