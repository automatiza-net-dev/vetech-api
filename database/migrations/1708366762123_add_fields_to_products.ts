import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "products";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("fractioned").defaultTo(false);
			table.uuid("fraction_unit_id").references("id").inTable("units");
			table.decimal("fraction_value", 10, 3).defaultTo(1);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("fractioned");
			table.dropColumn("fraction_unit_id");
			table.dropColumn("fraction_value");
		});
	}
}
