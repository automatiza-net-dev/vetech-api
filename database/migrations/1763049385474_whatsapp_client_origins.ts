import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "whatsapp_client_origins";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");
			table.integer("system_id").notNullable().references("systems.id");
			table
				.uuid("client_origin_id")
				.notNullable()
				.references("client_origins.id");

			table.string("platform_integration").notNullable();
			table.string("description_origin").notNullable();

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
