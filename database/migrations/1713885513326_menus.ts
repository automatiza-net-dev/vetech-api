import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "menus";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.string("description");
			table.text("icon");
			table.string("route");
			table.integer("order");
			table.boolean("active");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
