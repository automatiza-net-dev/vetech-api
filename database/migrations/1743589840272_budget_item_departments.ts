import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budget_item_departments";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("budget_id").notNullable().references("budgets.id");
			table.uuid("budget_item_id").notNullable().references("budget_items.id");
			table.integer("department_id").notNullable().references("departments.id");
			table
				.integer("department_item_id")
				.notNullable()
				.references("department_items.id");
			table.uuid("creation_user_id").notNullable().references("users.id");
			table.uuid("updated_user_id").references("users.id");
			table.uuid("deleted_user_id").references("users.id");

			table.text("observations").defaultTo("");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
