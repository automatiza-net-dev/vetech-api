import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "department_products";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.integer("department_id").references("departments.id");
			table.uuid("product_id").references("products.id");
			table.uuid("creation_user_id").notNullable().references("users.id");
			table.uuid("updated_user_id").references("users.id");
			table.uuid("deleted_user_id").references("users.id");

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
