import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patients";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("business_unit_id").references("business_units.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("business_unit_id");
		});
	}
}
