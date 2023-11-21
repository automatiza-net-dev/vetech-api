import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipt_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.float("icms_credit_percentage");
			table.float("icms_credit_value");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("icms_credit_percentage");
			table.dropColumn("icms_credit_value");
		});
	}
}
