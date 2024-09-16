import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "payment_method_flags";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("installments_without_password");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("installments_without_password");
		});
	}
}
