import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "attendances";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.text("internal_observation").nullable();
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("internal_observation");
		});
	}
}
