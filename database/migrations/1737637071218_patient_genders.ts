import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_genders";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.integer("system_id").references("systems.id");
			table.uuid("economic_group_id").references("economic_groups.id");

			table.string("type", 10).notNullable();
			table.string("description", 100).notNullable();

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
