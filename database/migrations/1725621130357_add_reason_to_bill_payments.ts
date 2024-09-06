import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("reason", 255);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("reason");
		});
	}
}
