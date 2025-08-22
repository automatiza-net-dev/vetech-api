import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import { VaccineType } from "App/Models/Vaccine";
import VaccineProtocol from "App/Models/VaccineProtocol";
import { IVaccineProtocolData } from "Contracts/interfaces/IVaccineProtocolData";
import { AuthContext } from "./SharedService";

interface ISearch {
	type?: VaccineType;
	protocol?: string;
	vaccine?: string;
	specie?: string;
	name?: string;
}

@inject()
export default class VaccineProtocolService {
	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = VaccineProtocol.query()
			.whereHas("vaccine", (qb) => {
				qb.whereRaw("(economic_group_id is null or economic_group_id = ?)", [
					authCtx.group.id,
				]);

				if (data.name) {
					qb.where("name", "ilike", `%${data.name}%`);
				}

				if (data.type) {
					qb.where("type", data.type);
				}

				if (data.vaccine) {
					qb.where("id", data.vaccine);
				}
			})
			.preload("vaccine")
			.preload("specie");

		if (data.protocol) {
			qb.where("name", "ilike", `%${data.protocol}%`);
		}

		if (data.specie) {
			qb.whereRaw("(specie_id = ? or specie_id is null)", [data.specie]);
		}

		// TODO paginate
		return qb;
	}

	public async store(data: Omit<IVaccineProtocolData, "active">) {
		return VaccineProtocol.create({
			vaccine_id: data.vaccineId,
			specie_id: data.specieId,

			expirationDays: data.expirationDays,
			name: data.name,
			doses: data.doses,
			interval: data.interval,
		});
	}

	public async show(id: string) {
		const model = await VaccineProtocol.find(id);

		if (!model) {
			throw new ResourceNotFoundException("Recurso não encontrado");
		}

		await model.load("vaccine");
		await model.load("specie");

		return model;
	}

	public async update(id: string, data: IVaccineProtocolData) {
		const model = await VaccineProtocol.find(id);

		if (!model) {
			throw new ResourceNotFoundException("Recurso não encontrado");
		}

		return model
			.merge({
				vaccine_id: data.vaccineId,
				specie_id: data.specieId,

				expirationDays: data.expirationDays,
				name: data.name,
				doses: data.doses,
				interval: data.interval,
				active: data.active,
			})
			.save();
	}

	public async destroy(id: string) {
		const model = await this.show(id);

		await model.softDelete();
	}
}
