import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "systems";
	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.json("default_config").defaultTo("{}");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("default_config");
		});
	}
}
