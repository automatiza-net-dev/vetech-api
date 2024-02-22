import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budget_payments";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("block_ref");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("block_ref");
		});
	}
}
