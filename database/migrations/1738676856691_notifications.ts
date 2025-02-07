import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "notifications";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table
				.integer("system_id")
				.notNullable()
				.unsigned()
				.references("systems.id");
			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("creation_user_id").notNullable().references("users.id");
			table.uuid("updated_user_id").references("users.id");
			table.uuid("deleted_user_id").references("users.id");

			table.boolean("is_required").defaultTo(false);
			table.string("type", 20).notNullable().checkIn(["Aviso", "Comunicado"]);
			table.text("message").notNullable();
			table.string("image", 100);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
