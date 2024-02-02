import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budgets";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.float("paid_value").defaultTo(0);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("paid_value");
		});
	}
}
