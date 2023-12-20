import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "borderos";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.uuid("id").primary();

			table
				.uuid("economic_group_id")
				.references("id")
				.inTable("economic_groups")
				.onDelete("CASCADE");
			table
				.uuid("business_unit_id")
				.references("id")
				.inTable("business_units")
				.onDelete("CASCADE");
			table
				.uuid("daily_movement_id")
				.references("id")
				.inTable("daily_movements")
				.onDelete("CASCADE");
			table
				.uuid("checking_account_id")
				.references("id")
				.inTable("checking_accounts")
				.onDelete("CASCADE");
			table
				.uuid("bank_statement_id")
				.references("id")
				.inTable("bankings")
				.onDelete("CASCADE");
			table
				.uuid("payment_method_id")
				.references("id")
				.inTable("payment_methods")
				.onDelete("CASCADE");

			table.string("type", 10);
			table.string("document", 100);
			table.string("description", 100);
			table.string("history", 100);
			table.dateTime("issue_date");
			table.dateTime("bordero_date");
			table.dateTime("payment_date");
			table.float("bordero_value");
			table.float("interest_value");
			table.float("discount_value");
			table.float("total_value");
			table.float("payment_value");
			table.string("observation", 500);
			table.string("reason_for_reversal", 300);
			table.string("status", 20);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
