import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "finance_reversals";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropForeign("finance_id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.foreign("finance_id")
				.references("id")
				.inTable("finances")
				.onDelete("CASCADE");
		});
	}
}
