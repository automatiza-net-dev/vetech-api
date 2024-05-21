import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_configs";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("schedule_late_minutes").defaultTo(10);
			table.integer("schedule_missed_minutes").defaultTo(10);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("schedule_late_minutes");
			table.dropColumn("schedule_missed_minutes");
		});
	}
}
