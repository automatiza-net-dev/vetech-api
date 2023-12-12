import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "deposit_items";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table
				.integer("deposit_id")
				.unsigned()
				.references("id")
				.inTable("deposits")
				.onDelete("CASCADE");

			table
				.uuid("business_unit_product_id")
				.references("business_unit_products.id");
			table.uuid("product_variation_id").references("product_variations.id");

			table.float("quantity");
			table.string("status");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
