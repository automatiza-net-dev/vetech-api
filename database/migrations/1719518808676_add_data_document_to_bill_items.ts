import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.datetime("data_document", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("data_document");
		});
	}
}
