import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "products";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("courtesy").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("courtesy");
		});
	}
}
