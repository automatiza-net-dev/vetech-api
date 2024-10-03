import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "finances";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("user_id")
				.references("id")
				.inTable("users")
				.onDelete("cascade");
			table
				.uuid("exclusion_user_id")
				.references("id")
				.inTable("users")
				.onDelete("cascade");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("user_id");
			table.dropColumn("exclusion_user_id");
		});
	}
}
