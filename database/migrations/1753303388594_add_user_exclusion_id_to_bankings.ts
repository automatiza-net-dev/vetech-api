import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bankings";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("user_exclusion_id").references("users.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("user_exclusion_id");
		});
	}
}
