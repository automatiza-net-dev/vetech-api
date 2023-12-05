import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budgets";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("client_name").nullable();
			table.text("internal_observation").nullable();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("client_name");
			table.dropColumn("internal_observation");
		});
	}
}
