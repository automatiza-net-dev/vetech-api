import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "borderos";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("client_id")
				.references("id")
				.inTable("patients")
				.onDelete("CASCADE");
			table
				.uuid("exclusion_user_id")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table
				.uuid("tef_flag_id")
				.references("id")
				.inTable("tef_flags")
				.onDelete("CASCADE");

			table.datetime("expiration_date");
			table.string("nsu_document", 40);
			table.integer("titles_qty").defaultTo(0);
			table.datetime("deleted_at");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("client_id");
			table.dropColumn("exclusion_user_id");
			table.dropColumn("tef_flag_id");
			table.dropColumn("expiration_date");
			table.dropColumn("nsu_document");
			table.dropColumn("titles_qty");
			table.dropColumn("deleted_at");
		});
	}
}
