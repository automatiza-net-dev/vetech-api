import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("origin_business_unit_id").references("business_units.id");
			table.uuid("related_bill_id").references("bills.id");

			table.string("receipt_type", 5).defaultTo("E").notNullable();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("origin_business_unit_id");
			table.dropColumn("related_bill_id");

			table.dropColumn("receipt_type");
		});
	}
}
