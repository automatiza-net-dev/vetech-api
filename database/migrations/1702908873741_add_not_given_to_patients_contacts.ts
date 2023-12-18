import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_contacts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("not_given").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("not_given");
		});
	}
}
