import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "treatment_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("exclusion_user_id")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.timestamp("exclusion_date");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("exclusion_user_id");
			table.dropColumn("exclusion_date");
		});
	}
}
