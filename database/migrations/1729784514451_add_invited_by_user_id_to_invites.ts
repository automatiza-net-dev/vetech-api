import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "invites";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("invited_by_user_id").references("users.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("invited_by_user_id");
		});
	}
}
