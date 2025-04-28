import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bills";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("bill_related_type_id").references("bill_related_types.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("bill_related_type_id");
		});
	}
}
