import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "account_plan_groups";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.boolean("dre_basis").defaultTo(false);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("dre_basis");
		});
	}
}
