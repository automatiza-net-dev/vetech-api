import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "opportunity_kanban_logs";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.bigIncrements("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table.integer("opportunity_id").references("opportunities.id");
			table.integer("origin_kanban_id").references("kanbans.id").notNullable();
			table
				.integer("destination_kanban_id")
				.references("kanbans.id")
				.notNullable();
			table.uuid("user_id").references("users.id").notNullable();

			table.timestamp("created_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
