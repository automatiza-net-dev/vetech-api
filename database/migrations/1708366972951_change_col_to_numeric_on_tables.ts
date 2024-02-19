import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableNames = [
		"bill_items",
		"receipt_items",
		"deposit_items",
		"deposit_movement_items",
		"budget_items",
	];

	public async up() {
		for (const tableName of this.tableNames) {
			this.schema.alterTable(tableName, (table) => {
				table.decimal("quantity", 10, 3).defaultTo(1).alter();
			});
		}
	}

	public async down() {
		for (const tableName of this.tableNames) {
			this.schema.alterTable(tableName, (table) => {
				table.float("quantity").defaultTo(1).alter();
			});
		}
	}
}
