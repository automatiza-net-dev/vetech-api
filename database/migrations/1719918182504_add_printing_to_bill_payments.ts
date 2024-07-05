import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("print_user_id").references("users.id");
			table.timestamp("printed_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("print_user_id");
			table.dropColumn("printed_at");
		});
	}
}
