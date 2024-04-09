import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import ClientOriginGroup from "App/Models/ClientOriginGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";

interface ISearch {
	description?: string;
}

@inject()
export default class ClientOriginGroupService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = ClientOriginGroup.query()
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			]);

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		return qb;
	}

	public async store(
		authCtx: AuthContext,
		data: { clientOriginCategoryId: number; description: string },
	) {
		return ClientOriginGroup.create({
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			client_origin_category_id: data.clientOriginCategoryId,
			description: data.description,
		});
	}

	public async show(authCtx: AuthContext, id: string) {
		const row = await ClientOriginGroup.query()
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!row) {
			throw new ResourceNotFoundException(
				"Origem não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		if (!row.economic_group_id) {
			return row;
		}

		if (authCtx.group.id !== row.economic_group_id) {
			throw new ResourceNotFoundException(
				"Origem não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		return row;
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: { clientOriginCategoryId: number; description: string },
	) {
		const row = await this.show(authCtx, id);

		if (!row.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		return row
			.merge({
				client_origin_category_id: data.clientOriginCategoryId,
				description: data.description,
			})
			.save();
	}

	public async destroy(authCtx: AuthContext, id: string) {
		const row = await this.show(authCtx, id);

		if (!row.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		await row.delete();
	}
}
