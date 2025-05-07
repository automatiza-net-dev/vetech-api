import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "opportunities";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.bigInteger("kanban_id").references("id").inTable("kanbans");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("kanban_id");
		});
	}
}
