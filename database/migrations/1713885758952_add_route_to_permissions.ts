import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "permissions";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.text("icon");
			table.string("route");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("icon");
			table.dropColumn("route");
		});
	}
}
