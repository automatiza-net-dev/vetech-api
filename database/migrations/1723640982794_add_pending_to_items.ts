import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_items";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.text("pending_observations");
			table.boolean("approved").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("pending_observations");
			table.dropColumn("approved");
		});
	}
}
