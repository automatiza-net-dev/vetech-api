import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ProductivityItem from "App/Models/ProductivityItem";
import ProductivityItemProduct from "App/Models/ProductivityItemProduct";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";

export const ProductivityItemOrigin = ["Portal", "Unidade"] as const;
export type TProductivityItemOrigin = (typeof ProductivityItemOrigin)[number];

@inject()
export default class ProductivityItemService {
	constructor(private shared: SharedService) {}

	public async searchItems(
		systemID: number,
		groupID: string | undefined,
		data: {
			origin?: TProductivityItemOrigin;
			active?: string;
		},
	) {
		const qb = ProductivityItem.query()
			.where("system_id", systemID)
			.whereNull("deleted_at")
			.orderByRaw('"order", description, id desc');

		if (data.origin === "Portal") {
			qb.whereNull("economic_group_id");
		}

		if ((!data.origin || data.origin === "Unidade") && !!groupID) {
			qb.whereRaw("(economic_group_id is null or economic_group_id = ?)", [
				groupID,
			]);
		}

		if (data.active) {
			qb.where("active", data.active === "1");
		}

		return qb;
	}

	public async searchItemProducts(
		authCtx: AuthContext,
		data: {
			product?: string;
			active?: string;
		},
	) {
		const qb = Database.from("productivity_items")
			.select(
				Database.raw(`
          productivity_item_products.id,
          productivity_item_products.productivity_item_id as p_id,
          productivity_items.description,
          productivity_item_products.quantity,
          productivity_items.reserved_minutes,
          productivity_item_products.order,
          productivity_items.active
      `),
			)
			.joinRaw(
				"join productivity_item_products on productivity_items.id = productivity_item_products.productivity_item_id",
				[],
			)
			.orderByRaw(
				"productivity_items.order, productivity_items.description, productivity_items.id asc",
			)
			.where("productivity_item_products.economic_group_id", authCtx.group.id)
			.where(
				"productivity_item_products.active",
				data.active ? data.active === "1" : true,
			)
			.whereNull("productivity_items.deleted_at")
			.whereNull("productivity_item_products.deleted_at");

		if (data.product) {
			qb.where("product_id", data.product);
		}

		return qb;
	}

	public async storeItem(
		systemID: number,
		groupID: string | undefined,
		data: {
			description: string;
			reservedMinutes: number;
			origin: TProductivityItemOrigin;
			order: number;
		},
	) {
		await ProductivityItem.create({
			system_id: systemID,
			economic_group_id: groupID,
			description: data.description,
			reservedMinutes: data.reservedMinutes,
			order: data.order,
		});
	}

	public async updateItem(
		authCtx: AuthContext,
		data: {
			id: number;
			description: string;
			reservedMinutes: number;
			active: boolean;
			order: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const item = await ProductivityItem.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("id", data.id)
				.first();

			if (!item) {
				throw this.shared.ResourceNotFound();
			}

			await item
				.merge({
					description: data.description,
					reservedMinutes: data.reservedMinutes,
					active: data.active,
					order: data.order,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async batchCreateItemProduct(
		authCtx: AuthContext,
		data: {
			items: {
				productivityItemId: number;
				productId: string;
				quantity: number;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const maxQueryResult: { max: number; product_id: string }[] =
				await Database.from("productivity_item_products")
					.useTransaction(trx)
					.select(Database.raw(`coalesce(max("order"), 0), product_id`))
					.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
						authCtx.group.id,
					])
					.whereNull("deleted_at")
					.groupByRaw("product_id");

			const prodItems = await ProductivityItem.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.whereIn(
					"id",
					data.items.map((e) => e.productivityItemId),
				)
				.whereNull("deleted_at");

			const tasks = prodItems.map((elem, idx) => {
				return elem.related("products").createMany(
					data.items
						.filter((inner) => inner.productivityItemId === elem.id)
						.map((inner) => ({
							economic_group_id: authCtx.group.id,
							product_id: inner.productId,
							quantity: inner.quantity,
							order:
								(maxQueryResult.find((r) => r.product_id === inner.productId)
									?.max ?? 0) +
								1 +
								idx,
						})),
					trx,
				);
			});

			await Promise.all(tasks);
		});
	}

	public async updateItemProduct(
		authCtx: AuthContext,
		data: {
			id: number;
			active: boolean;
			order: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const item = await ProductivityItemProduct.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("id", data.id)
				.first();

			if (!item) {
				throw this.shared.ResourceNotFound();
			}

			await item
				.merge({
					active: data.active,
					order: data.order,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async deleteProductivityItem(authCtx: AuthContext, itemID: string) {
		await Database.transaction(async (trx) => {
			const checkResult: { src: string }[] = await Database.from(
				"productivity_item_products",
			)
				.useTransaction(trx)
				.select(Database.raw("'Produtos' as src"))
				.where("productivity_item_id", itemID)
				.whereNull("deleted_at")
				.union((union1) => {
					union1
						.from("treatment_items")
						.select(Database.raw("'Tratamentos' as src"))
						.where("productivity_item_id", itemID);
				})
				.union((union2) => {
					union2
						.from("treatment_executions")
						.select(Database.raw("'Execuções' as src"))
						.where("productivity_item_id", itemID);
				});

			if (checkResult.length > 0) {
				throw new BadRequestException(
					"Este item de produtividade não pode ser excluido pois está relacionado a produtos, serviços ou tratamentos. Marque o item como 'Ativo = Não'",
					400,
					"E_ERR",
				);
			}

			await ProductivityItem.query()
				.useTransaction(trx)
				.where("id", itemID)
				.where("economic_group_id", authCtx.group.id)
				.whereNull("deleted_at")
				.update({
					exclusion_user_id: authCtx.user.id,
					deleted_at: DateTime.now(),
				});
		});
	}

	public async deleteProductivityItemProduct(
		authCtx: AuthContext,
		itemProductID: string,
	) {
		await Database.transaction(async (trx) => {
			await ProductivityItemProduct.query()
				.useTransaction(trx)
				.where("id", itemProductID)
				.where("economic_group_id", authCtx.group.id)
				.whereNull("deleted_at")
				.update({
					exclusion_user_id: authCtx.user.id,
					deleted_at: DateTime.now(),
				});
		});
	}
}
