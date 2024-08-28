import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_configs";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("crm_useful_days").defaultTo(true);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("crm_useful_days");
		});
	}
}
