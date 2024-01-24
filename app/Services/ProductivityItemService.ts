import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ProductivityItem from "App/Models/ProductivityItem";
import ProductivityItemProduct from "App/Models/ProductivityItemProduct";
import SharedService, { AuthContext } from "App/Services/SharedService";

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
		const qb = ProductivityItem.query().where("system_id", systemID);

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
		const qb = ProductivityItemProduct.query()
			.preload("product")
			.where("economic_group_id", authCtx.group.id)
			.where("active", data.active ? data.active === "1" : true);

		if (data.product) {
			qb.where("product_id", data.product);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			quantity: elem.quantity,
			description: elem.product.description,
		}));
	}

	public async storeItem(
		systemID: number,
		groupID: string | undefined,
		data: {
			description: string;
			reservedMinutes: number;
			origin: TProductivityItemOrigin;
		},
	) {
		if (data.origin === "Portal") {
			await ProductivityItem.create({
				system_id: systemID,
				description: data.description,
				reservedMinutes: data.reservedMinutes,
			});
			return;
		}

		await ProductivityItem.create({
			system_id: systemID,
			economic_group_id: groupID,
			description: data.description,
			reservedMinutes: data.reservedMinutes,
		});
	}

	public async updateItem(
		authCtx: AuthContext,
		data: {
			id: number;
			description: string;
			reservedMinutes: number;
			active: boolean;
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
			const prodItems = await ProductivityItem.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.whereIn(
					"id",
					data.items.map((e) => e.productivityItemId),
				);

			const tasks = prodItems.map((elem) => {
				return elem.related("products").createMany(
					data.items
						.filter((inner) => inner.productivityItemId === elem.id)
						.map((inner) => ({
							economic_group_id: authCtx.group.id,
							product_id: inner.productId,
							quantity: inner.quantity,
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
			quantity: number;
			active: boolean;
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
				.merge({ quantity: data.quantity, active: data.active })
				.useTransaction(trx)
				.save();
		});
	}
}
