import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "finances";

	public async up() {
		this.schema.table(this.tableName, (table) => {
			table
				.integer("bordero_id")
				.references("id")
				.inTable("borderos")
				.onDelete("CASCADE");
		});
	}

	public async down() {
		this.schema.table(this.tableName, (table) => {
			table.dropColumn("bordero_id");
		});
	}
}
