import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_documents";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table
				.uuid("economic_group_id")
				.references("id")
				.inTable("economic_groups");
			table.uuid("business_unit_id").references("id").inTable("business_units");
			table.uuid("bill_id").references("id").inTable("bills");
			table
				.uuid("document_template_id")
				.references("id")
				.inTable("document_templates");
			table.uuid("generation_user_id").references("id").inTable("users");
			table.uuid("print_user_id").references("id").inTable("users");
			table.uuid("exclusion_user_id").references("id").inTable("users");

			table.string("timeline_ref");
			table.timestamp("printed_at", { useTz: true }).defaultTo(null);
			table.boolean("active").defaultTo(true);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true }).defaultTo(null);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
