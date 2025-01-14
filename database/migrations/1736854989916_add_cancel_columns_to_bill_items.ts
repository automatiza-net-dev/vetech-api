import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("reviewer_cancel_user_id").references("id").inTable("users");

			table.string("cancelled", 1).checkIn(["P", "N", "S"]).defaultTo(null);
			table.dateTime("review_cancel_date").nullable();
			table.text("review_cancel_notes").nullable();
			table.decimal("original_total_value", 10, 2).nullable();
			table.decimal("original_quantity", 10, 2).nullable();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("reviewer_cancel_user_id");
			table.dropColumn("cancelled");

			table.dropColumn("review_cancel_date");
			table.dropColumn("review_cancel_notes");

			table.dropColumn("original_total_value");
			table.dropColumn("original_quantity");
		});
	}
}
