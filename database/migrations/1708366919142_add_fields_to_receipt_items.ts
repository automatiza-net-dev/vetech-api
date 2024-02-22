import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipt_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.decimal("fraction_value", 10, 3).defaultTo(1);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("fraction_value");
		});
	}
}
