import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "schedule_status_changes";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("finance_pending_authorization_user_id")
				.references("users.id");
			table.datetime("finance_pending_authorized_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("finance_pending_authorization_user_id");
			table.dropColumn("finance_pending_authorized_at");
		});
	}
}
