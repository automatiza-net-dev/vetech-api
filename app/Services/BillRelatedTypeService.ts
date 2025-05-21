import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import BillRelatedType from "App/Models/BillRelatedType";
import { DateTime } from "luxon";
import { AuthContext } from "./SharedService";

@inject()
export default class BillRelatedTypeService {
	public async index(
		authCtx: AuthContext,
		data: {
			id?: string;
			description?: string;
			active?: string;
		},
	) {
		const resultQb = BillRelatedType.query()
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			]);

		if (data.id) {
			resultQb.where("id", data.id);
		}

    if (data.description) {
			resultQb.whereRaw("description ilike ?", [`%${data.description}%`]);
		}

		if (data.active) {
			resultQb.where("active", data.active);
		}

		const result = await resultQb;

		return result.map((r) => ({
			id: r.id,
			system_id: r.system_id,
			economic_group_id: r.economic_group_id,
			creation_user_id: r.creation_user_id,
			update_user_id: r.update_user_id,
			description: r.description,
			active: r.active,
			created_at: r.createdAt,
			updated_at: r.updatedAt,
		}));
	}

	public async store(
		authCtx: AuthContext,
		data: {
			economicGroupId?: string;
			description: string;
		},
	) {
		return BillRelatedType.create({
			system_id: authCtx.system.id,
			economic_group_id: data.economicGroupId,
			description: data.description,
			active: true,
			creation_user_id: authCtx.user.id,
			createdAt: DateTime.now(),
		});
	}

	public async update(
		authCtx: AuthContext,
		data: {
			id: number;
			description: string;
			active: boolean;
		},
	) {
		return Database.transaction(async (trx) => {
			const brt = await BillRelatedType.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("id", data.id)
				.firstOrFail();

			return brt
				.merge({
					update_user_id: authCtx.user.id,
					description: data.description,
					active: data.active,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async delete(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		return Database.transaction(async (trx) => {
			const brt = await BillRelatedType.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("id", data.id)
				.firstOrFail();

			const existingRow = await Database.from("bills")
				.useTransaction(trx)
				.where("bill_related_type_id", data.id)
				.first();
			if (existingRow) {
				throw new BadRequestException(
					"Este tipo de venda relacionada não pode ser excluido pois foi adicionado a uma ou mais vendas. Você pode marcá-lo como Inativo",
					400,
					"E_ERR",
				);
			}

			return brt
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}
}
