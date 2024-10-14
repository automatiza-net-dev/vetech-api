import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import { VaccineType } from "App/Models/Vaccine";
import VaccineProtocol from "App/Models/VaccineProtocol";
import { IVaccineProtocolData } from "Contracts/interfaces/IVaccineProtocolData";

interface ISearch {
	type?: VaccineType;
	vaccine?: string;
	specie?: string;
	name?: string;
}

@inject()
export default class VaccineProtocolService {
	public async index(data: ISearch) {
		const qb = VaccineProtocol.query().preload("vaccine").preload("specie");

		if (data.name) {
			qb.where("name", "ilike", `%${data.name}%`);
		}

		if (data.specie) {
			qb.whereRaw("(specie_id = ? or specie_id is null)", [data.specie]);
		}

		if (data.type || data.vaccine) {
			qb.whereHas("vaccine", (query) => {
				if (data.type) {
					query.where("type", data.type);

					// if (data.type === "vermifuge") {
					// } else {
					// }
				}

				if (data.vaccine) {
					query.where("id", data.vaccine);
				}
			});
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
