import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "finances";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("accept_user_id").references("users.id");
			table.uuid("unaccept_user_id").references("users.id");

			table.datetime("unaccepted_date", { useTz: true });
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("accept_user_id");
			table.dropColumn("unaccept_user_id");

			table.dropColumn("unaccepted_date");
		});
	}
}
