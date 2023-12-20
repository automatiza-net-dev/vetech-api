import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "borderos";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("account_plan_id")
				.references("id")
				.inTable("account_plans")
				.onDelete("SET NULL");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("account_plan_id");
		});
	}
}
