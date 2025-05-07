import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Variation from "App/Models/Variation";
import VariationOption from "App/Models/VariationOption";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IVariationData from "Contracts/interfaces/IVariationData";

interface ISearch {
	description?: string;
}

@inject()
export default class VariationService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(unitId: string, data: ISearch): Promise<Array<Variation>> {
		const group = await this.sharedService.getUserGroup(unitId);

		const qb = Variation.query()
			.where("economic_group_id", group.id)
			.preload("options");

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		return qb;
	}

	public async show(unitId: string, id: string): Promise<Variation> {
		const group = await this.sharedService.getUserGroup(unitId);

		const variation = await group
			.related("variations")
			.query()
			.where("id", id)
			.preload("options")
			.first();

		if (!variation) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return variation;
	}

	public async store(
		authCtx: AuthContext,
		data: Omit<IVariationData, "active">,
	): Promise<Variation> {
		return Database.transaction(async (trx) => {
			const variation = await authCtx.group.related("variations").create(
				{
					description: data.description,
				},
				{
					client: trx,
				},
			);

			await VariationOption.createMany(
				data.options.map((row) => ({
					variation_id: variation.id,
					description: row.description,
				})),
				{ client: trx },
			);

			return variation;
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IVariationData,
	): Promise<Variation> {
		const variation = await this.show(authCtx.unit.id, id);

		return Database.transaction(async (trx) => {
			const updatedVariation = variation
				.merge({
					description: data.description,
					active: data.active,
				})
				.useTransaction(trx)
				.save();

			const tasks = data.options.map((row) => {
				if (row.id) {
					return VariationOption.query()
						.useTransaction(trx)
						.where("id", row.id)
						.where("variation_id", variation.id)
						.update({
							description: row.description,
						});
				}

				return VariationOption.create(
					{
						variation_id: variation.id,
						description: row.description,
					},
					{ client: trx },
				);
			});
			await Promise.all(tasks);

			return updatedVariation;
		});
	}

	public async destroy(unitId: string, id: string): Promise<void> {
		const variation = await this.show(unitId, id);

		await variation.softDelete();
	}
}
