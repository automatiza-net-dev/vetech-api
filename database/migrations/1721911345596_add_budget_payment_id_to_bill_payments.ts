import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("budget_payment_id").references("budget_payments.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("budget_payment_id");
		});
	}
}
