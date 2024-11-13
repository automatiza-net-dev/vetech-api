import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budget_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("approved_user_id").references("users.id");
			table.boolean("pending").defaultTo(false);
			table.text("reason");
			table.boolean("approved").defaultTo(false);
			table.dateTime("approved_at");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("approved_user_id");
			table.dropColumn("pending");
			table.dropColumn("reason");
			table.dropColumn("approved");
			table.dropColumn("approved_at");
		});
	}
}
