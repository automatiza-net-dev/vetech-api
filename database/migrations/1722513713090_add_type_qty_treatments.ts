import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "productivity_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("type_qty", 20);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("type_qty");
		});
	}
}
