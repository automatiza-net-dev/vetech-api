import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_authorizations";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.bigIncrements("id");

			table
				.uuid("bill_id")
				.unsigned()
				.references("id")
				.inTable("bills")
				.onDelete("CASCADE");
			table
				.uuid("bill_item_id")
				.unsigned()
				.references("id")
				.inTable("bill_items")
				.onDelete("CASCADE");
			table
				.uuid("bill_payment_id")
				.unsigned()
				.references("id")
				.inTable("bill_payments")
				.onDelete("CASCADE");
			table
				.uuid("authorization_user_id")
				.unsigned()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");

			table.string("type", 15);
			table.string("authoritation_type", 15);
			table.boolean("approved");
			table.integer("cancelled_quantity");
			table.timestamp("authorization_date", { useTz: true });
			table.string("authorization_observations", 1000);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
