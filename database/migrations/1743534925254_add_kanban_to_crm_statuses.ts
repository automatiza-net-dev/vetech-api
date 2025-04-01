import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "crm_statuses";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.bigInteger("kanban_id").references("kanbans.id");
			table.uuid("user_creation_id").references("id").inTable("users");
			table.uuid("user_updated_id").references("id").inTable("users");
			table.uuid("exclusion_user_id").references("id").inTable("users");

			table.integer("order").defaultTo(99);

			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("kanban_id");
			table.dropColumn("user_creation_id");
			table.dropColumn("user_updated_id");
			table.dropColumn("exclusion_user_id");

			table.dropColumn("order");
			table.dropColumn("deleted_at");
		});
	}
}
