import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "treatment_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("bill_item_id").references("bill_items.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("bill_item_id");
		});
	}
}
