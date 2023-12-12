import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "deposits";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("principal").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("principal");
		});
	}
}
