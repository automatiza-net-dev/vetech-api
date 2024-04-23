import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "system_taxation_group_rules";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.string("tax_operation_code");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("tax_operation_code");
		});
	}
}
