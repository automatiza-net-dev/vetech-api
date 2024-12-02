import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "hospitalization_occurrences";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("creation_user_id").references("users.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("creation_user_id");
		});
	}
}
