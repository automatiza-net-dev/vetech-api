import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipt_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("deleted_user_id").references("users.id");
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("deleted_user_id");
			table.dropColumn("deleted_at");
		});
	}
}
