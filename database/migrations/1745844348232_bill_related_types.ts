import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_related_types";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.integer("system_id").references("systems.id").notNullable();
			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("creation_user_id").references("users.id");
			table.uuid("update_user_id").references("users.id");
			table.uuid("exclusion_user_id").references("users.id");

			table.string("description", 100).notNullable();
			table.boolean("active").defaultTo(true).notNullable();

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
