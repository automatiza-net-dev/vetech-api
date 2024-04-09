import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import ClientOriginCategory from "App/Models/Vaccine";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { IClientOriginCategoryData } from "Contracts/interfaces/IVaccineData";

interface ISearch {
	name?: string;
	description?: string;
}

@inject()
export default class ClientOriginCategoryService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = ClientOriginCategory.query()
			.preload("protocols", (query) => {
				query.select("id", "name", "doses", "interval", "active", "specie_id");

				query.preload("specie", (query) => {
					query.select("id", "description");
				});
			})
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			]);

		if (data.name) {
			qb.where("name", "ilike", `%${data.name}%`);
		}

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		// TODO paginate
		return qb;
	}

	public async store(
		authCtx: AuthContext,

		data: Omit<IClientOriginCategoryData, "active">,
	) {
		return ClientOriginCategory.create({
			name: data.name,
			description: data.description,
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			subgroup_id: data.subgroupId,
			type: data.type,
		});
	}

	public async show(authCtx: AuthContext, id: string) {
		const vaccine = await ClientOriginCategory.query()
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!vaccine) {
			throw new ResourceNotFoundException(
				"Vacina não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		if (!vaccine.economic_group_id) {
			return vaccine;
		}

		if (authCtx.group.id !== vaccine.economic_group_id) {
			throw new ResourceNotFoundException(
				"Vacina não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		return vaccine;
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IClientOriginCategoryData,
	) {
		const vaccine = await this.show(authCtx, id);

		if (!vaccine.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		return vaccine
			.merge({
				name: data.name,
				description: data.description,
				subgroup_id: data.subgroupId,
				active: data.active,
				type: data.type,
			})
			.save();
	}

	public async destroy(authCtx: AuthContext, id: string) {
		const vaccine = await this.show(authCtx, id);

		if (!vaccine.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		await vaccine.softDelete();
	}
}
