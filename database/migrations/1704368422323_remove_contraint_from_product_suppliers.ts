import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "supplier_products";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropUnique([
				"economic_group_id",
				"supplier_id",
				"product_supplier_id",
			]);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.unique(["economic_group_id", "supplier_id", "product_supplier_id"]);
		});
	}
}
