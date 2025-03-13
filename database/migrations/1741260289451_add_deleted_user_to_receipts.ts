import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("deleted_user_id").references("users.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("deleted_user_id");
		});
	}
}
