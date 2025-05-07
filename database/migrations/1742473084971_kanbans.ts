import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "kanbans";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.bigIncrements("id");

			table
				.uuid("economic_group_id")
				.references("id")
				.inTable("economic_groups");
			table.uuid("business_unit_id").references("id").inTable("business_units");
			table.uuid("user_creation_id").references("id").inTable("users");
			table.uuid("user_updated_id").references("id").inTable("users");
			table.uuid("exclusion_user_id").references("id").inTable("users");

			table.string("description", 100);
			table.string("type", 20);
			table.boolean("active").defaultTo(true);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
