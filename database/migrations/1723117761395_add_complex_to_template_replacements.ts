import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "template_replacements";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("complex").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("complex");
		});
	}
}
