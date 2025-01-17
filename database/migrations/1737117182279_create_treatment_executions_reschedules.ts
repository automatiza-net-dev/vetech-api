import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "treatment_execution_reschedules";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units");
			table.integer("treatment_id").references("id").inTable("treatments");
			table.integer("treatment_item_id");
			table.integer("treatment_item_execution_id");
			table.uuid("schedule_id").references("schedules.id");
			table.uuid("schedule_user_id").references("users.id");
			table.uuid("reschedule_user_id").references("users.id");
			table.uuid("reason_id").references("reasons.id");

			table.string("evaluation_id");
			table.dateTime("schedule_date");
			table.dateTime("reschedule_date");
			table.text("observations");

			table.timestamp("created_at", { useTz: true });
			table.timestamp("updated_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
