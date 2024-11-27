import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "systems";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("type", 10).defaultTo("Clinica");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("type");
		});
	}
}
