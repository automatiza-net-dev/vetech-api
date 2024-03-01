import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_checking_account_payment_methods";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table
				.uuid("payment_method_id")
				.references("id")
				.inTable("payment_methods")
				.onDelete("CASCADE");
			table
				.uuid("business_unit_id")
				.references("id")
				.inTable("business_units")
				.onDelete("CASCADE");
			table
				.uuid("checking_account_id")
				.references("id")
				.inTable("checking_accounts")
				.onDelete("CASCADE");

			table.boolean("active");

			table.timestamp("deleted_at", { useTz: true }).defaultTo(null);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
