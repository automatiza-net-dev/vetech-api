import { inject } from "@adonisjs/fold";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
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
		const qb = Deposit.query().where("economic_group_id", authCtx.group.id);
		// .where("business_unit_id", authCtx.unit.id);

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
		const row = await Deposit.query()
			.where("economic_group_id", authCtx.group.id)
			// .where("business_unit_id", authCtx.unit.id)
			.where("id", id)
			.preload("items", (query) => {
				query.preload("unitProduct", (query) => {
					query.select("id");
				});

				query.preload("variation", (query) => {
					query.select("id", "barcode", "product_id");

					query.preload("product", (query) => {
						query.select("id", "description");
					});
				});
			})
			.first();

		if (!row) {
			throw this.sharedService.ResourceNotFound();
		}

		return row;
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

	public async updatePrincipalDeposit(authCtx: AuthContext, id: number) {
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

			if (row.status !== "Ativo") {
				throw new BadRequestException(
					"O depósito deve estar ativo para ser principal",
					400,
					"E_INVALID_STATUS",
				);
			}

			if (row.type !== "Venda") {
				throw new BadRequestException(
					"O depósito deve ser do tipo venda para ser principal",
					400,
					"E_INVALID_TYPE",
				);
			}

			await Deposit.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("type", "Venda")
				.update({ principal: false });

			await row.merge({ principal: true }).useTransaction(trx).save();
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

	public async searchDepositMovements(
		authCtx: AuthContext,
		data: {
			from?: string;
			to?: string;
			user?: string;
			responsible?: string;
			removal?: string;
			fromDeposit?: string;
			toDeposit?: string;
			type?: string;
			status?: string;
		},
	) {
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
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id);

		if (data.from) {
			qb.whereRaw("date::date >= ?", [data.from]);
		}

		if (data.to) {
			qb.whereRaw("date::date <= ?", [data.to]);
		}

		if (data.user) {
			qb.where("user_id", data.user);
		}

		if (data.responsible) {
			qb.where("responsible_user_id", data.responsible);
		}

		if (data.removal) {
			qb.where("removal_user_id", data.removal);
		}

		if (data.fromDeposit) {
			qb.where("from_deposit_id", data.fromDeposit);
		}

		if (data.toDeposit) {
			qb.where("to_deposit_id", data.toDeposit);
		}

		if (data.type) {
			qb.whereHas("toDeposit", (q) => {
				q.where("type", data.type ?? ("Venda" as TDepositType));
			}).orWhereHas("fromDeposit", (q) => {
				q.where("type", data.type ?? ("Venda" as TDepositType));
			});
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		return qb;
	}

	public async showDepositMovement(
		authCtx: AuthContext,
		data: {
			ids: number[];
		},
	) {
		return DepositMovement.query()
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
			.where("business_unit_id", authCtx.unit.id)
			.whereIn("id", Array.isArray(data.ids) ? data.ids : []);
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
				.where("id", data.toDepositId)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!toRow) {
				throw this.sharedService.ResourceNotFound();
			}

			if (data.items.length > 0) {
				await this.$checkDepositItems(trx, fromRow, data.items, true);
				await this.$checkDepositItems(trx, toRow, data.items);
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

			// await this.$updateDepositItems(trx, movement, "origem");
			// await this.$updateDepositItems(trx, movement, "destino");
		});
	}

	private async $checkDepositItems(
		trx: TransactionClientContract,
		deposit: Deposit,
		items: { businessUnitProductId: string; quantity: number }[],
		withQuantity = false,
	) {
		const fromRowItems = await deposit
			.related("items")
			.query()
			.useTransaction(trx)
			.select("id", "business_unit_product_id", "quantity")
			.exec();
		if (fromRowItems.length === 0) {
			throw new BadRequestException(
				"O depósito de origem não possui itens para serem movimentados",
				400,
				"E_INVALID_ITEMS",
			);
		}
		if (fromRowItems.length !== items.length) {
			throw new BadRequestException(
				"A quantidade de itens informada é diferente da quantidade de itens do depósito de origem",
				400,
				"E_INVALID_ITEMS",
			);
		}

		if (withQuantity) {
			if (
				fromRowItems.some((item) =>
					items.some(
						(i) =>
							i.businessUnitProductId === item.business_unit_product_id &&
							i.quantity > item.quantity,
					),
				)
			) {
				throw new BadRequestException(
					"A quantidade de itens informada é maior que a quantidade de itens do depósito de origem",
					400,
					"E_INVALID_ITEMS",
				);
			}
		}
	}

	private async $updateDepositItems(
		trx: TransactionClientContract,
		movement: DepositMovement,
		type: "origem" | "destino",
	) {
		if (type === "origem") {
			await Database.rawQuery(
				`update deposit_items
        set quantity = di.quantity - dmi.quantity
        from deposit_items di
          join deposit_movement_items dmi on di.business_unit_product_id = dmi.business_unit_product_id
          join deposit_movements dm
            on dm.id = dmi.deposit_movement_id and di.deposit_id = dm.from_deposit_id and dm.id = ?;`,
				[movement.id],
			)
				.useTransaction(trx)
				.exec();
		}

		if (type === "destino") {
			await Database.rawQuery(
				`update deposit_items
		      set quantity = di.quantity + dmi.quantity
		      from deposit_items di
		        join deposit_movement_items dmi on di.business_unit_product_id = dmi.business_unit_product_id
		        join deposit_movements dm
		          on dm.id = dmi.deposit_movement_id and di.deposit_id = dm.from_deposit_id and dm.id = ?;`,
				[movement.id],
			)
				.useTransaction(trx)
				.exec();
		}
	}
}
