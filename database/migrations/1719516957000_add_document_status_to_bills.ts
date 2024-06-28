import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bills";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("documents_status", 20);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("documents_status");
		});
	}
}
