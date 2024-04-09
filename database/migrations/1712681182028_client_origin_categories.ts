import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "client_origin_categories";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table
				.uuid("economic_group_id")
				.references("id")
				.inTable("economic_groups")
				.onDelete("CASCADE");
			table
				.integer("system_id")
				.references("id")
				.inTable("systems")
				.onDelete("CASCADE");

			table.string("description");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
