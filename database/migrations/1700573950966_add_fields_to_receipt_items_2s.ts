import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipt_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.float("icms_percentage_deferred");
			table.float("icms_operation_value");
			table.float("icms_exonerated_value");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("icms_percentage_deferred");
			table.dropColumn("icms_operation_value");
			table.dropColumn("icms_exonerated_value");
		});
	}
}
