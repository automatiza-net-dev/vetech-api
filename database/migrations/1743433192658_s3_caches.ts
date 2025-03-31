import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "s3_caches";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.bigIncrements("id");

			table.string("key", 255);
			table.text("value");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("expires_at", { useTz: true });

			table.index(["key", "expires_at"]);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
