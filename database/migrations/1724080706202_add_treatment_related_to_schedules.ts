import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "schedules";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("treatment_id").references("treatments.id");
			table.integer("treatment_item_id");
			table.integer("treatment_execution_id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("treatment_id");
			table.dropColumn("treatment_item_id");
			table.dropColumn("treatment_execution_id");
		});
	}
}
