import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import Deposit, { TDepositStatus, TDepositType } from "App/Models/Deposit";
import DepositItem, { TDepositItemStatus } from "App/Models/DepositItem";
import DepositMovement from "App/Models/DepositMovement";
import { DateTime } from "luxon";
import SharedService, { AuthContext } from "./SharedService";

@inject()
export default class DepositService {
	constructor(private readonly sharedService: SharedService) {}

	public async searchDeposits(
		authCtx: AuthContext,
		data: {
			description?: string;
			type?: string;
			status?: string;
		},
	) {
		const qb = Deposit.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id);

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		return qb;
	}

	public async showDeposit(authCtx: AuthContext, id: number) {
		return Deposit.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("id", id)
			.preload("items", (query) => {
				query.preload("unitProduct", (query) => {
					query.select("id");
				});

				query.preload("variation", (query) => {
					query.select("id", "product_id");

					query.preload("product", (query) => {
						query.select("id", "description");
					});
				});
			});
	}

	public async createDeposit(
		authCtx: AuthContext,
		data: {
			description: string;
			type: TDepositType;
		},
	) {
		return Deposit.create({
			economic_group_id: authCtx.group.id,
			business_unit_id: authCtx.unit.id,

			description: data.description,
			type: data.type,
			status: "Ativo",
		});
	}

	public async updateDeposit(
		authCtx: AuthContext,
		id: number,
		data: {
			description: string;
			type: TDepositType;
			status: TDepositStatus;
		},
	) {
		return Database.transaction(async (trx) => {
			const row = await Deposit.query()
				.useTransaction(trx)
				.where("id", id)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!row) {
				throw this.sharedService.ResourceNotFound();
			}

			return row
				.merge({
					description: data.description,
					type: data.type,
					status: data.status,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async createDepositItem(
		authCtx: AuthContext,
		data: {
			depositId: number;
			businessUnitProductId: string;
			productVariationId: string;

			quantity: number;
		},
	) {
		return Database.transaction(async (trx) => {
			const row = await Deposit.query()
				.useTransaction(trx)
				.where("id", data.depositId)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!row) {
				throw this.sharedService.ResourceNotFound();
			}

			return row.related("items").create(
				{
					business_unit_product_id: data.businessUnitProductId,
					product_variation_id: data.productVariationId,
					quantity: data.quantity,
					status: "Ativo",
				},
				{ client: trx },
			);
		});
	}

	public async updateDepositItem(
		authCtx: AuthContext,
		data: {
			depositItemId: number;
			businessUnitProductId: string;

			quantity: number;
			status: TDepositItemStatus;
		},
	) {
		return Database.transaction(async (trx) => {
			const row = await DepositItem.query()
				.useTransaction(trx)
				.where("id", data.depositItemId)
				.where("business_unit_product_id", data.businessUnitProductId)
				.whereHas("deposit", (q) => {
					q.where("economic_group_id", authCtx.group.id).where(
						"business_unit_id",
						authCtx.unit.id,
					);
				})
				.first();

			if (!row) {
				throw this.sharedService.ResourceNotFound();
			}

			return row
				.merge({
					quantity: row.quantity + data.quantity,
					status: data.status,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async searchDepositMovements(authCtx: AuthContext, data: {}) {
		const qb = DepositMovement.query()
			.preload("group", (query) => {
				query.select("id", "company_name");
			})
			.preload("unit", (query) => {
				query.select("id", "identification");
			})
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("responsibleUser", (query) => {
				query.select("id", "name");
			})
			.preload("removalUser", (query) => {
				query.select("id", "name");
			})
			.preload("fromDeposit", (query) => {
				query.select("id", "description");
			})
			.preload("toDeposit", (query) => {
				query.select("id", "description");
			})
			.preload("items", (query) => {
				query.preload("unitProduct", (query) => {
					query.select("id");
				});
				query.preload("variation", (query) => {
					query.select("id", "product_id");
					query.preload("product", (query) => {
						query.select("id", "description");
					});
				});
			})

			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id);

		// if (data.description) {
		// 	qb.where("description", "ilike", `%${data.description}%`);
		// }
		//
		// if (data.type) {
		// 	qb.where("type", data.type);
		// }
		//
		// if (data.status) {
		// 	qb.where("status", data.status);
		// }

		return qb;
	}

	public async createDepositMovement(
		authCtx: AuthContext,
		data: {
			responsibleUserId: string;
			removalUserId: string;

			fromDepositId: number;
			toDepositId: number;

			items: {
				businessUnitProductId: string;
				productVariationId: string;
				quantity: number;
			}[];
		},
	) {
		return Database.transaction(async (trx) => {
			const fromRow = await Deposit.query()
				.useTransaction(trx)
				.where("id", data.fromDepositId)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!fromRow) {
				throw this.sharedService.ResourceNotFound();
			}

			const toRow = await Deposit.query()
				.useTransaction(trx)
				.where("id", data.fromDepositId)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!toRow) {
				throw this.sharedService.ResourceNotFound();
			}

			const movement = await DepositMovement.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					user_id: authCtx.user.id,
					responsible_user_id: data.responsibleUserId,
					removal_user_id: data.removalUserId,
					from_deposit_id: data.fromDepositId,
					to_deposit_id: data.toDepositId,

					date: DateTime.now(),
					status: "Ativo",
				},
				{ client: trx },
			);

			await movement.related("items").createMany(
				data.items.map((item) => ({
					product_variation_id: item.productVariationId,
					business_unit_product_id: item.businessUnitProductId,
					quantity: item.quantity,
					status: "Ativo",
				})),
				{ client: trx },
			);
		});
	}
}
