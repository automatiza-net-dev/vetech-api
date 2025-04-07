import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import VariationGroup from "App/Models/VariationGroup";
import VariationOption from "App/Models/VariationOption";
import SharedService, { AuthContext } from "App/Services/SharedService";
import VariationService from "App/Services/VariationService";
import IAssignGroupVariation from "Contracts/interfaces/IAssignGroupVariation";
import IVariationGroupData from "Contracts/interfaces/IVariationGroupData";

@inject()
export default class VariationGroupService {
	constructor(
		private readonly sharedService: SharedService,
		private readonly variationService: VariationService,
	) {}

	public async index(unitId: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		return group
			.related("variationGroups")
			.query()
			.preload("variations", (query) => {
				query.preload("options");
			});
	}

	public async show(unitId: string, id: string): Promise<VariationGroup> {
		const group = await this.sharedService.getUserGroup(unitId);

		const variation = await group
			.related("variationGroups")
			.query()
			.where("id", id)
			.preload("variations")
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
		data: Omit<IVariationGroupData, "active"> & { options: string[] },
	) {
		return Database.transaction(async (trx) => {
			const variationGroup = await authCtx.group
				.related("variationGroups")
				.create(
					{
						description: data.description,
					},
					{
						client: trx,
					},
				);

			await variationGroup.related("variations").sync(data.options, true, trx);

			return variationGroup;
		});
	}

	public async assignVariation(unitId: string, data: IAssignGroupVariation) {
		const variation = await this.variationService.show(
			unitId,
			data.variation_id,
		);

		const alreadyRelated = await variation.related("variationGroups").query();
		const idList = alreadyRelated.map((r) => r.id);
		const newIdList = Array.from(new Set([...idList, data.group_variation_id]));
		await variation.related("variationGroups").sync(newIdList);
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IVariationGroupData & { options: string[] },
	) {
		const variation = await this.show(authCtx.unit.id, id);

		return Database.transaction(async (trx) => {
			const updatedVariation = await variation
				.merge({
					description: data.description,
					active: data.active,
				})
				.useTransaction(trx)
				.save();

			await updatedVariation
				.related("variations")
				.sync(data.options, true, trx);

			return updatedVariation;
		});
	}

	public async destroy(unitId: string, id: string) {
		const group = await this.show(unitId, id);

		await group.softDelete();
	}

	public async detach(unitId: string, group: string, variation: string) {
		const entity = await this.show(unitId, group);

		await entity.related("variations").detach([variation]);
	}
}
