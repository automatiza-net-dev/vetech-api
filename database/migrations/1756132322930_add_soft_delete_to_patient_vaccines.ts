import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_vaccines";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("exclusion_user_id").references("users.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {});
	}
}
