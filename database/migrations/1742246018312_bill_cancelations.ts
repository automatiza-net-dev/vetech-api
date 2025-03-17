import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_cancelations";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("bill_id").references("id").inTable("bills");
			table.uuid("cancel_user_id").references("id").inTable("users");
			table.uuid("cancel_reason_id").references("id").inTable("cancel_reasons");
			table.uuid("finish_cancel_user_id").references("id").inTable("users");
			table.uuid("exclusion_user_id").references("id").inTable("users");

			table.string("cancelled", 1);
			table.string("cancel_reason", 1000);
			table.decimal("cancel_value_products", 12, 2);
			table.decimal("cancel_value_services", 12, 2);
			table.decimal("cancel_value_total", 12, 2);
			table.string("cancel_notes", 1000);

			table.timestamp("finish_cancel_date", { useTz: true });
			table.timestamp("cancel_date", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
