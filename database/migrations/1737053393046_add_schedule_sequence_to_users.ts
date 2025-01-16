import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "users";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("schedule_sequence").defaultTo(99);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("schedule_sequence");
		});
	}
}
