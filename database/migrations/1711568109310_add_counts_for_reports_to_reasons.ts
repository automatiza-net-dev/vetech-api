import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "reasons";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("counts_for_report").defaultTo(true);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("counts_for_report");
		});
	}
}
