import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "system_products";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("unit_id")
				.nullable()
				.references("id")
				.inTable("units")
				.onDelete("CASCADE");

			table
				.uuid("subgroup_id")
				.nullable()
				.references("id")
				.inTable("subgroups")
				.onDelete("CASCADE");

			table
				.uuid("brand_id")
				.nullable()
				.references("id")
				.inTable("brands")
				.onDelete("CASCADE");
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
