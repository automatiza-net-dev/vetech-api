import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_contracts";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table.uuid("patient_id").references("patients.id");
			table.uuid("product_id").references("products.id");
			table.uuid("product_variation_id").references("product_variations.id");
			table
				.uuid("business_unit_product_id")
				.references("business_unit_products.id");
			table.uuid("payment_method_id").references("payment_methods.id");
			table.uuid("user_creation_id").references("users.id");
			table.uuid("user_exclusion_id").references("users.id");

			table.decimal("quantity", 10, 3).notNullable();
			table.float("unitary_value").notNullable();
			table.float("promotional_value").notNullable();
			table.date("promotional_value_expiration").notNullable();
			table.integer("expiration_day").defaultTo(1).checkPositive();
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
