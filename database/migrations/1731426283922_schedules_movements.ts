import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "schedules_movements";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table.uuid("schedule_id").references("schedules.id");
			table.uuid("creation_user_id").references("users.id");
			table.uuid("deletion_user_id").references("users.id");
			table.uuid("movement_id").comment("ID de uma venda ou orçamento");

			table.string("type", 10).checkIn(["bill", "budget"]);

			/**
			 * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
			 */
			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
