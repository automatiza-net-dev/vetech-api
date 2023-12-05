import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_configs";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.bigInteger("incoming_deposit_id")
				.unsigned()
				.references("id")
				.inTable("deposits")
				.onDelete("CASCADE");
			table
				.bigInteger("outgoing_deposit_id")
				.unsigned()
				.references("id")
				.inTable("deposits")
				.onDelete("CASCADE");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("incoming_deposit_id");
			table.dropColumn("outgoing_deposit_id");
		});
	}
}
