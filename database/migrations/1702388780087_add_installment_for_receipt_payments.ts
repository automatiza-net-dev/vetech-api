import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "receipt_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("installment").defaultTo(1);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("installment");
		});
	}
}
