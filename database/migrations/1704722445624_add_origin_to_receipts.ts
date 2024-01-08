import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("origin");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("origin");
		});
	}
}
