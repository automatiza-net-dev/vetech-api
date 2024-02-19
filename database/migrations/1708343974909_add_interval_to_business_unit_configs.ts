import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_configs";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("return_interval").defaultTo(30);
			table.integer("allowed_return_qty").defaultTo(1);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("return_interval");
			table.dropColumn("allowed_return_qty");
		});
	}
}
