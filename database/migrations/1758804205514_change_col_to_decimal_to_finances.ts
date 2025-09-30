import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "finances";

	protected columns = [
		"original_value",
		"value",
		"total_value",
		"payment_value",
		"fee_value",
		"discount_value",
		"addition_value",
	];

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			for (const col of this.columns) {
				table.decimal(col, 10, 2).alter();
			}
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			for (const col of this.columns) {
				table.float(col).alter();
			}
		});
	}
}
