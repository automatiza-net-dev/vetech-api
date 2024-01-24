import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("exclusion_user_id").references("users.id");

			table.timestamp("deleted_at", { useTz: true }).defaultTo(null);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("exclusion_user_id");

			table.dropColumn("deleted_at");
		});
	}
}
