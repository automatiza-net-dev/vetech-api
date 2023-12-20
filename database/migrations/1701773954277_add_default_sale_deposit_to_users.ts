import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "users";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("default_sale_deposit_id")
				.unsigned()
				.references("id")
				.inTable("deposits")
				.onDelete("CASCADE");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("default_sale_deposit_id");
		});
	}
}
