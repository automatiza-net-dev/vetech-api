import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budget_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.decimal("sale_value", 10, 2).defaultTo(0);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("sale_value");
		});
	}
}
