import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.float("icms_deferred_operation_value");
			table.float("icms_deferred_percentage");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("icms_deferred_operation_value");
			table.dropColumn("icms_deferred_percentage");
		});
	}
}
