import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "borderos";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("competence_date", 10);
			table.datetime("down_date");
			table.float("interest_percentage");
			table.float("discount_percentage");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("competence_date");
			table.dropColumn("down_date");
			table.dropColumn("interest_percentage");
			table.dropColumn("discount_percentage");
		});
	}
}
