import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "system_urls";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("default_role_id").references("id").inTable("roles");

			table.string("name");
			table.text("colors").defaultTo("red,blue,green,yellow,purpe");
			table.string("mail_image").nullable();
			table.string("mail_background_color").nullable();
			table.text("mail_text_new_user");
			table.text("mail_text_warn_user");
			table.json("default_config").defaultTo("{}");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("default_role_id");

			table.dropColumn("name");
			table.dropColumn("colors");
			table.dropColumn("mail_image");
			table.dropColumn("mail_background_color");
			table.dropColumn("mail_text_new_user");
			table.dropColumn("mail_text_warn_user");
			table.dropColumn("default_config");
		});
	}
}
