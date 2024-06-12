import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "products";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("system_product_id")
				.references("system_products.id")
				.after("economic_group_id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("system_product_id");
		});
	}
}
