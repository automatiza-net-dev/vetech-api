import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("courtesy_issued_user_id")
				.references("id")
				.inTable("users")
				.after("tax_rule_id");
			table
				.uuid("courtesy_approved_user_id")
				.references("id")
				.inTable("users")
				.after("courtesy_issued_user_id");

			table.boolean("courtesy").defaultTo(false);
			table.timestamp("courtesy_approved_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("courtesy_issued_user_id");
			table.dropColumn("courtesy_approved_user_id");

			table.boolean("courtesy").defaultTo(false);
			table.timestamp("courtesy_approved_at", { useTz: true });
		});
	}
}
