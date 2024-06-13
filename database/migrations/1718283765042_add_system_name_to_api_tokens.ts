import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "api_tokens";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("system_name").nullable();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("system_name");
		});
	}
}
