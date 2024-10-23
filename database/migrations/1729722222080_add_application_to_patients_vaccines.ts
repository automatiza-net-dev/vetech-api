import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_vaccines";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.timestamp("last_application_at");
			table.timestamp("valid_until");
			table.string("status", 20);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("last_application_at");
			table.dropColumn("valid_until");
			table.dropColumn("status");
		});
	}
}
