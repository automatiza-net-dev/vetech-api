import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "budget_payments";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table.uuid("budget_id").references("budgets.id");
			table.uuid("tef_flag_id").references("tef_flags.id");
			table.uuid("tef_acquirer_id").references("tef_acquirers.id");
			table.uuid("payment_method_id").references("payment_methods.id");
			table.uuid("user_id").references("users.id");
			table.uuid("change_user_id").references("users.id");
			table.uuid("conclusion_user_id").references("users.id");
			table.uuid("exclusion_user_id").references("users.id");

			table.integer("block");
			table.float("total_value");
			table.integer("installments");
			table.string("status", 10);
			table.datetime("confirmation_date");
			table.string("exclusion_origin");
			table.timestamp("issue_date", { useTz: true });
			table.timestamp("update_date", { useTz: true });

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
			table.timestamp("deleted_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
