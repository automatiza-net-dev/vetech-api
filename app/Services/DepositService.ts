import { inject } from "@adonisjs/fold";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Deposit, { TDepositStatus, TDepositType } from "App/Models/Deposit";
import DepositItem, { TDepositItemStatus } from "App/Models/DepositItem";
import DepositMovement from "App/Models/DepositMovement";
import { DateTime } from "luxon";

import Decimal from "decimal.js";
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
			unitId?: string;
		},
	) {
		const qb = Deposit.query().preload("unit", (query) => {
			query.select("id", "identification");
		});

		if (data.unitId) {
			qb.where("business_unit_id", data.unitId);
		} else {
			qb.where("economic_group_id", authCtx.group.id);
		}

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
					quantity: new Decimal(data.quantity),
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
					quantity: row.quantity.plus(data.quantity),
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
				throw new BadRequestException(
					"Deposito de estoque não encontrado",
					400,
					"E_NOT_FOUND",
				);
			}

			const toRow = await Deposit.query()
				.useTransaction(trx)
				.where("id", data.toDepositId)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!toRow) {
				throw new BadRequestException(
					"Deposito de estoque não encontrado",
					400,
					"E_NOT_FOUND",
				);
			}

			if (data.items.length > 0) {
				const result1 = await this.$checkDepositItems(
					trx,
					fromRow,
					data.items,
					"Origem",
				);
				if (result1.length !== 0) {
					return result1;
				}

				// const result2 = await this.$checkDepositItems(
				// 	trx,
				// 	toRow,
				// 	data.items,
				// 	"Destino",
				// );
				// if (result2.length !== 0) {
				// 	return result2;
				// }
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
					quantity: new Decimal(item.quantity),
					status: "Ativo",
				})),
				{ client: trx },
			);

			await Database.rawQuery(
				`insert into deposit_items (deposit_id, business_unit_product_id, product_variation_id, quantity, status, created_at,
                           updated_at)
select ?, bup.id, bup.product_variation_id, 0, 'Ativo', now(), now()
from deposit_movement_items dmi
         join deposit_movements dm on dmi.deposit_movement_id = dm.id
         join business_unit_products bup
              on dmi.product_variation_id = bup.product_variation_id and dm.business_unit_id = bup.businness_unit_id
where dmi.deposit_movement_id = ?
  and dmi.product_variation_id not in
      (select product_variation_id from deposit_items where deposit_id = ?)
      `,
				[toRow.id, movement.id, toRow.id],
			)
				.useTransaction(trx)
				.exec();

			await Database.rawQuery(
				`update deposit_items
        set quantity =
        (select diDest.quantity + dmi.quantity
         from deposit_items diDest
                  join deposit_movement_items dmi
                       on diDest.product_variation_id = dmi.product_variation_id and
                          diDest.business_unit_product_id = dmi.business_unit_product_id
         where diDest.deposit_id = ?
           and dmi.deposit_movement_id = ?
           and deposit_items.business_unit_product_id = diDest.business_unit_product_id)
where deposit_id = ?
  and product_variation_id in
      (select product_variation_id from deposit_movement_items where deposit_movement_id = ?)`,
				[toRow.id, movement.id, toRow.id, movement.id],
			)
				.useTransaction(trx)
				.exec();

			await Database.rawQuery(
				`update deposit_items
        set quantity =
        (select diOri.quantity - dmi.quantity
         from deposit_items diOri
                  join deposit_movement_items dmi
                       on diOri.product_variation_id = dmi.product_variation_id and
                          diOri.business_unit_product_id = dmi.business_unit_product_id
         where diOri.deposit_id = ?
           and dmi.deposit_movement_id = ?
           and deposit_items.business_unit_product_id = diOri.business_unit_product_id)
where deposit_id = ?
  and product_variation_id in
      (select product_variation_id from deposit_movement_items where deposit_movement_id = ?);`,
				[fromRow.id, movement.id, fromRow.id, movement.id],
			)
				.useTransaction(trx)
				.exec();

			// await this.$updateDepositItems(trx, movement, "origem");
			// await this.$updateDepositItems(trx, movement, "destino");
		});
	}

	public async updateDepositItems(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		billID: string,
		data: { productVariationId: string; quantity: number }[],
	) {
		if (!authCtx.unit.unitConfig.controlsDeposit) {
			return;
		}

		await Database.rawQuery(`select update_quantity_on_deposit(?, ?, ?, ?)`, [
			authCtx.user.id,
			authCtx.unit.id,
			billID,
			JSON.stringify(
				data.map((elem) => ({
					variacao: elem.productVariationId,
					quantidade: elem.quantity,
				})),
			),
		])
			.useTransaction(trx)
			.exec();
	}

	public async validateDepositOperation(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: { productVariationId: string; quantity: number }[],
	) {
		if (!authCtx.unit.unitConfig.controlsDeposit) {
			return [];
		}

		const result = await Database.rawQuery(
			`select * from check_quantity_on_deposit(?, ?, ?)`,
			[
				authCtx.user.id,
				authCtx.unit.id,
				JSON.stringify(
					data.map((elem) => ({
						variacao: elem.productVariationId,
						quantidade: elem.quantity,
					})),
				),
			],
		)
			.useTransaction(trx)
			.exec();

		return result.rows.map((elem) => ({
			description: elem.descricao,
		})) as { description: string }[];
	}

	private async $checkDepositItems(
		trx: TransactionClientContract,
		deposit: Deposit,
		items: { productVariationId: string; quantity: number }[],
		label: string,
	) {
		await Database.rawQuery(
			`
create temporary table mov_dep
(
    idVariacao uuid,
    quantidade int
);`,
		)
			.useTransaction(trx)
			.exec();

		const tasks = items.map((elem) =>
			Database.rawQuery("insert into mov_dep values (?, ?)", [
				elem.productVariationId,
				elem.quantity,
			])
				.useTransaction(trx)
				.exec(),
		);
		await Promise.all(tasks);

		const result = await Database.rawQuery(
			`select products.description,
       mov_dep.idVariacao,
       mov_dep.quantidade,
       product_variations.barcode,
       product_variations.id,
       *
from mov_dep
         join product_variations on mov_dep.idVariacao = product_variations.id
         join products on product_variations.product_id = products.id
where mov_dep.idVariacao not in (select di.product_variation_id
                                 from deposit_items di
                                 where deposit_id = ?
                                   and di.product_variation_id = mov_dep.idVariacao
                                   and di.quantity >= mov_dep.quantidade);`,
			[deposit.id],
		)
			.useTransaction(trx)
			.exec();

		await Database.rawQuery("drop table mov_dep;").useTransaction(trx).exec();

		return result.rows.map((elem: { description: string }) => ({
			rule: "ItemNaoExiste",
			message: `Item '${elem.description}' não possui quantidade suficiente no depósito de ${label}`,
		}));
	}
}
