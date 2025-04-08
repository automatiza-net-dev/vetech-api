import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_units";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("system_id")
				.notNullable()
				.references("systems.id")
				.defaultTo(1);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("system_id");
		});
	}
}
