import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bills";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("cancellation_user_id");
			table.dropColumn("cancellation_reason_id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("cancellation_user_id").references("users.id");
			table.uuid("cancellation_reason_id").references("reasons.id");
		});
	}
}
