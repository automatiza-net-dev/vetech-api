import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "opportunities";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("ganho");
			table.boolean("perda");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("ganho");
			table.dropColumn("perda");
		});
	}
}
