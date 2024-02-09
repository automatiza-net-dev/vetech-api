import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "treatment_executions";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("productivity_item_id")
				.references("id")
				.inTable("productivity_items")
				.onDelete("CASCADE");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("productivity_item_id");
		});
	}
}
