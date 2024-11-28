import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budgets";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("internal_code", 50);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("internal_code");
		});
	}
}
