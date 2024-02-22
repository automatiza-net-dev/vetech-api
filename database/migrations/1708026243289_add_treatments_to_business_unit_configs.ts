import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_configs";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("shows_treatment_schedules").defaultTo(false);
			table
				.uuid("treatment_schedule_service_type_id")
				.references("id")
				.inTable("schedule_service_types");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("shows_treatment_schedules");
			table.dropColumn("treatment_schedule_service_type_id");
		});
	}
}
