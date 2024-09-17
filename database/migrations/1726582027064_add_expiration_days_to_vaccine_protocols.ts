import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "vaccine_protocols";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("expiration_days");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("expiration_days");
		});
	}
}
