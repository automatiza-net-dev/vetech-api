import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "service_issued_fiscal_documents";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("national").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("national");
		});
	}
}
