import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bills";
	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("cancel_user_id").references("id").inTable("users");
			table.uuid("cancel_reason_id").references("id").inTable("reasons");
			table.uuid("finish_cancel_user_id").references("id").inTable("users");

			table.string("cancelled").checkIn(["P", "A", "N", "S"]).defaultTo(null);
			table.dateTime("cancel_date").defaultTo(null);
			table.dateTime("finish_cancel_date").defaultTo(null);
			table.text("cancel_reason").defaultTo(null);
			table.text("cancel_notes").defaultTo(null);
			table.decimal("cancel_value_products").defaultTo(null);
			table.decimal("cancel_value_services").defaultTo(null);
			table.decimal("cancel_value_total").defaultTo(null);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("cancel_user_id");
			table.dropColumn("cancel_reason_id");
			table.dropColumn("finish_cancel_user_id");

			table.dropColumn("cancelled");
			table.dropColumn("cancel_date");
			table.dropColumn("finish_cancel_date");
			table.dropColumn("cancel_reason");
			table.dropColumn("cancel_notes");
			table.dropColumn("cancel_value_products");
			table.dropColumn("cancel_value_services");
			table.dropColumn("cancel_value_total");
		});
	}
}
