import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "service_issued_fiscal_documents";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("rps_series", 20).alter();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {});
	}
}
