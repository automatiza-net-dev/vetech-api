import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budget_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("max_discount").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("max_discount");
		});
	}
}
