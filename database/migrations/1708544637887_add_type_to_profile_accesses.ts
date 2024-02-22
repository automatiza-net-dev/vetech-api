import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "profile_accesses";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("type");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("type");
		});
	}
}
