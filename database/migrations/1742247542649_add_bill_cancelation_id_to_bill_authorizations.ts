import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_authorizations";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("bill_cancelation_id").references("bill_cancelations.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("bill_cancelation_id");
		});
	}
}
