import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "document_templates";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("type", 10);
			table.string("file_name");
			table.string("source_file");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("type");
			table.dropColumn("file_name");
			table.dropColumn("source_file");
		});
	}
}
