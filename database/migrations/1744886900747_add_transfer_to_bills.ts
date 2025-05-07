import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bills";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("destiny_business_unit_id").references("business_units.id");
			table.uuid("related_receipt_id").references("receipts.id");

			table.string("bill_type", 5);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("destiny_business_unit_id");
			table.dropColumn("related_receipt_id");

			table.dropColumn("bill_type");
		});
	}
}
