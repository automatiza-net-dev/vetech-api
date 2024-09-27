import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "dre_cost_planning_items";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");
			table
				.integer("dre_cost_planning_id")
				.references("dre_cost_plannings.id")
				.notNullable();
			table
				.uuid("account_plan_id")
				.references("account_plans.id")
				.notNullable();

			table.uuid("create_user_id").references("users.id");

			table.decimal("cost", 18, 2).notNullable();

			table.timestamp("created_at", { useTz: true });

			table.primary(["dre_cost_planning_id", "account_plan_id"]);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
