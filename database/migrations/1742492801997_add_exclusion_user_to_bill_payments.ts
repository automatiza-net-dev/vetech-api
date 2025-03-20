import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("exclusion_user_id").references("users.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("exclusion_user_id");
		});
	}
}
