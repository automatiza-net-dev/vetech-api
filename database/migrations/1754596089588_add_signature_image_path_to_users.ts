import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "users";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("signature_image_path");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("signature_image_path");
		});
	}
}
