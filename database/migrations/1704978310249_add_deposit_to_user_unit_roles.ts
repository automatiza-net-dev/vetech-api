import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "user_unit_roles";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("default_sale_deposit_id")
				.references("id")
				.inTable("deposits")
				.onDelete("SET NULL");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("default_sale_deposit_id");
		});
	}
}
