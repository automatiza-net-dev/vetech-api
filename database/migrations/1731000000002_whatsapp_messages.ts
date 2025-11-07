import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class WhatsAppMessages extends BaseSchema {
	protected tableName = "whatsapp_messages";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id").primary();
			table
				.integer("whatsapp_messages_config_id")
				.references("id")
				.inTable("whatsapp_messages_configs")
				.onDelete("CASCADE");
			table.string("platform_integration").notNullable();
			table.boolean("processed").defaultTo(false);
			table.text("processed_message").nullable();
			table.json("payload").notNullable();
			table.timestamp("created_at", { useTz: true }).defaultTo(this.now());
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
