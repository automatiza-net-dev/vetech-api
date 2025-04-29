import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budgets";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("origin_budget_id").references("budgets.id");
			table
				.integer("budget_related_type_id")
				.references("bill_related_types.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("origin_budget_id");
			table.dropColumn("budget_related_type_id");
		});
	}
}
