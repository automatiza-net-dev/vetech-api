import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "account_plans";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("tag");

			table.unique(["system_id", "tag"]);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("tag");
		});
	}
}
