import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "hospitalizations";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.datetime("finished_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("finished_at");
		});
	}
}
