import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableNames = [
		"issued_fiscal_documents",
		"service_issued_fiscal_documents",
	];

	public async up() {
		for (const tableName of this.tableNames) {
			this.schema.alterTable(tableName, (table) => {
				table.decimal("total_value", 10, 2).defaultTo(0);
			});
		}
	}

	public async down() {
		for (const tableName of this.tableNames) {
			this.schema.alterTable(tableName, (table) => {
				table.dropColumn("total_value");
			});
		}
	}
}
