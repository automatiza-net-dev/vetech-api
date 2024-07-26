import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "issued_fiscal_documents";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("finality").defaultTo(1);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("finality");
		});
	}
}
