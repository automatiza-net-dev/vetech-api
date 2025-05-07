import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bills";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.decimal("original_total_value", 10, 2).nullable();
			table.decimal("original_products_value", 10, 2).nullable();
			table.decimal("original_services_value", 10, 2).nullable();
			table.decimal("original_discount_value", 10, 2).nullable();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.decimal("original_total_value");
			table.decimal("original_products_value");
			table.decimal("original_services_value");
			table.decimal("original_discount_value");
		});
	}
}
