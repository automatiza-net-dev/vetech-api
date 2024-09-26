import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "account_plan_groups";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("dre_group_id").references("dre_groups.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("dre_group_id");
		});
	}
}
