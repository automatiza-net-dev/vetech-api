import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "dre_groups";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.integer("system_id").unsigned().references("systems.id");
			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("create_user_id").references("users.id");
			table.uuid("update_user_id").references("users.id");
			table.uuid("delete_user_id").references("users.id");

			table.string("description", 255);
			table.integer("sequence").defaultTo(0);
			table.boolean("active").defaultTo(true);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });

			table.unique(["economic_group_id", "system_id", "sequence"]);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
