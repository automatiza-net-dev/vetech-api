import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "performance_range_goals";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.integer("meta_id").unsigned().references("metas.id");
			table.uuid("create_user_id").references("users.id");
			table.uuid("delete_user_id").references("users.id");

			table.decimal("start_value", 18, 2);
			table.decimal("end_value", 18, 2);
			table.string("color").defaultTo("#000");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
