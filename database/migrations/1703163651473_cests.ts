import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "cests";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.string("cest", 15);
			table.string("ncm", 15);
			table.string("description", 255);
			table.boolean("active").defaultTo(true);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
