import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "crm_statuses";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("sync_schedules").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("sync_schedules");
		});
	}
}
