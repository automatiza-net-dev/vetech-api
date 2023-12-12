import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "deposit_movements";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table.uuid("user_id").references("users.id");
			table.uuid("responsible_user_id").references("users.id");
			table.uuid("removal_user_id").references("users.id");
			table
				.integer("from_deposit_id")
				.unsigned()
				.references("id")
				.inTable("deposits")
				.onDelete("CASCADE");
			table
				.integer("to_deposit_id")
				.unsigned()
				.references("id")
				.inTable("deposits")
				.onDelete("CASCADE");

			table.timestamp("date");
			table.string("status");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
