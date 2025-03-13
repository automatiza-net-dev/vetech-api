import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "bill_authorizations";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.renameColumn("authoritation_type", "authorization_type");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {});
	}
}
