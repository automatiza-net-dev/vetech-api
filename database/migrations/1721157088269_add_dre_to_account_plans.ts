import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "account_plans";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("dre").defaultTo(true);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("dre");
		});
	}
}
