import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "marketing_campaigns";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table.uuid("create_user_id").references("users.id");
			table.uuid("update_user_id").references("users.id");
			table.uuid("delete_user_id").references("users.id");

			table.string("description");
			table.decimal("investment_value", 10, 2).defaultTo(0);
			table.date("start_date");
			table.date("end_date");
			table.boolean("active").defaultTo(true);

			table.timestamp("deleted_at", { useTz: true });
			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
