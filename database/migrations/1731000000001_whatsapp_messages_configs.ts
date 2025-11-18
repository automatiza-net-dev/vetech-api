import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class WhatsAppMessagesConfigs extends BaseSchema {
	protected tableName = "whatsapp_messages_configs";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id").primary();
			table
				.uuid("business_unit_id")
				.references("id")
				.inTable("business_units")
				.onDelete("CASCADE");
			table
				.uuid("user_id_created")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.timestamp("created_at", { useTz: true }).defaultTo(this.now());
			table
				.uuid("user_id_updated")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE")
				.nullable();

			table.string("whatsapp_phone").notNullable();
			table.uuid("tintim_client_id");
			table.string("platform_integration").notNullable();
			table.boolean("active").defaultTo(true);
			table.timestamp("updated_at", { useTz: true }).defaultTo(this.now());
			table.string("connection_status").nullable();
			table.timestamp("connection_status_date", { useTz: true }).nullable();
			table.timestamp("deleted_at", { useTz: true }).nullable();
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
