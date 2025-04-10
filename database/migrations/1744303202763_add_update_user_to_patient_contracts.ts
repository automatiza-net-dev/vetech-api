import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "patient_contracts";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.uuid("user_updated_id")
				.references("users.id")
				.after("user_creation_id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("user_updated_id");
		});
	}
}
