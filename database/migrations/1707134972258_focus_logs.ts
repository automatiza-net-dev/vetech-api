import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "focus_logs";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("document_id");
			table.string("origin");
			table.string("description");
			table.json("input");
			table.json("data");
			table.json("error");

			table.timestamp("created_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
