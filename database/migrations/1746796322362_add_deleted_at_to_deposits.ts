import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "deposits";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.timestamp("deleted_at", { useTz: true }).defaultTo(null);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("deleted_at");
		});
	}
}
