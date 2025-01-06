import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "treatment_execution_reschedules";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("schedule_id").references("schedules.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("schedule_id");
		});
	}
}
