import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "systems";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("mail_image").nullable();
			table.string("mail_background_color").nullable();
			table.text("mail_text_new_user");
			table.text("mail_text_warn_user");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("mail_text_new_user");
			table.dropColumn("mail_text_warn_user");
			table.dropColumn("mail_background_color");
			table.dropColumn("mail_image");
		});
	}
}
