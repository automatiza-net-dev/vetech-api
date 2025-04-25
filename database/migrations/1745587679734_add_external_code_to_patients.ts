import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patients";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("external_code", 50);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("external_code");
		});
	}
}
