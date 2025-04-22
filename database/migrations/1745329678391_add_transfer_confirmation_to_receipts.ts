import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("confirmation_user_id").references("users.id");

			table.datetime("transfer_confirmation_date", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("confirmation_user_id");

			table.dropColumn("transfer_confirmation_date");
		});
	}
}
