import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ProductInventory from "App/Models/ProductInventory";

@inject()
export default class ProductInventoryService {
	public static async ProcessItems() {
		const rows: {
			economic_group_id: string;
			business_unit_id: string;
			date: string;
			pid: string;
			pvid: string;
			bupid: string;
			cost_price: string;
			stock: string;
		}[] = await Database.from("deposits")
			.select(
				Database.raw(`deposits.economic_group_id,
       deposits.business_unit_id,
       now()::date               as date,
       products.id               as pid,
       product_variations.id     as pvid,
       business_unit_products.id as bupid,
       coalesce(sum(deposit_items.quantity), 0) as stock,
       business_unit_products.cost_price`),
			)
			.joinRaw("join deposit_items on deposits.id = deposit_items.deposit_id")
			.joinRaw(
				"join product_variations on deposit_items.product_variation_id = product_variations.id",
			)
			.joinRaw(
				"join business_unit_products on deposit_items.business_unit_product_id = business_unit_products.id",
			)
			.joinRaw("join products on product_variations.product_id = products.id")
			.whereRaw("deposits.type = 'Venda'")
			.groupByRaw(
				"deposits.economic_group_id, deposits.business_unit_id, products.id, product_variations.id, business_unit_products.id",
			);

		await ProductInventory.createMany(
			rows.map((row) => ({
				economic_group_id: row.economic_group_id,
				business_unit_id: row.business_unit_id,
				product_id: row.pid,
				product_variation_id: row.pvid,
				business_unit_product_id: row.bupid,
				date: row.date,
				stock: row.stock,
				costPrice: row.cost_price,
			})),
		);
	}
}
