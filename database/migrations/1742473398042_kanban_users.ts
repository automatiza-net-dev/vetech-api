import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "kanban_users";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.bigIncrements("id");

			table.bigInteger("kanban_id").references("id").inTable("kanbans");
			table.uuid("user_id").references("id").inTable("users");
			table.uuid("user_creation_id").references("id").inTable("users");
			table.uuid("user_updated_id").references("id").inTable("users");
			table.uuid("exclusion_user_id").references("id").inTable("users");

			table.boolean("active").defaultTo(true);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
