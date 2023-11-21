import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "supplier_products";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.bigIncrements("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("supplier_id").references("patients.id");
			table.uuid("product_variation_id").references("product_variations.id");

			table.string("product_supplier_id");
			table.boolean("active").defaultTo(true);

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });

			table.unique(["economic_group_id", "supplier_id", "product_supplier_id"]);
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
