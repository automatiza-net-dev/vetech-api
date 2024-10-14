import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "dre_cost_plannings";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("business_unit_id").references("business_units.id");
			table.uuid("create_user_id").references("users.id");
			table.uuid("update_user_id").references("users.id");
			table.uuid("delete_user_id").references("users.id");

			table.string("period", 20);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });

			// business_unit_id, period are unique if deleted_at is null
			table.unique(["business_unit_id", "period"], {
				predicate: this.knex().where("deleted_at", null),
			});
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
