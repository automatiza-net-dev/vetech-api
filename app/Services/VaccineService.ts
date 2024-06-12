import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Vaccine from "App/Models/Vaccine";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { IVaccineData } from "Contracts/interfaces/IVaccineData";

interface ISearch {
	name?: string;
	description?: string;
	type?: string;
}

@inject()
export default class VaccineService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = Vaccine.query()
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

		if (data.type) {
			qb.where("type", data.type);
		}

		// TODO paginate
		return qb;
	}

	public async store(
		authCtx: AuthContext,

		data: Omit<IVaccineData, "active">,
	) {
		return Vaccine.create({
			name: data.name,
			description: data.description,
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			subgroup_id: data.subgroupId,
			type: data.type,
		});
	}

	public async show(authCtx: AuthContext, id: string) {
		const vaccine = await Vaccine.query()
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

	public async update(authCtx: AuthContext, id: string, data: IVaccineData) {
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
