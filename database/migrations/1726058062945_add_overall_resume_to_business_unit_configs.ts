import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "business_unit_configs";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("overall_resume_type", 10).defaultTo("geral");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("overall_resume_type");
		});
	}
}
