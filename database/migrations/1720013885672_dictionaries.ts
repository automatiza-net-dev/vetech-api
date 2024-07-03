import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "dictionaries";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.string("lang").notNullable();
			table.string("client").notNullable();
			table.string("key").notNullable();
			table.string("word").notNullable();

			table.timestamp("created_at", { useTz: true });

			table.unique(["lang", "client", "key"]);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
