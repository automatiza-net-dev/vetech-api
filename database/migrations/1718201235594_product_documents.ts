import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "product_documents";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.integer("system_id").unsigned().references("id").inTable("systems");
			table
				.integer("system_product_id")
				.unsigned()
				.references("id")
				.inTable("system_products");
			table
				.uuid("economic_group_id")
				.references("id")
				.inTable("economic_groups");
			table.uuid("business_unit_id").references("id").inTable("business_units");
			table.uuid("product_id").references("id").inTable("products");
			table
				.uuid("document_template_id")
				.references("id")
				.inTable("document_templates");
			table.uuid("exclusion_user_id").references("id").inTable("users");

			table.string("type", 10);
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
