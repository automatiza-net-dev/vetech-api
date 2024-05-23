import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "systems";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.text("colors").defaultTo("red,blue,green,yellow,purpe");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("colors");
		});
	}
}
