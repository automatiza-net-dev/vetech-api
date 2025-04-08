import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "schedules";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.uuid("confirmation_user_id").references("users.id");
			table.datetime("confirmation_conference_date", { useTz: true });
			table.datetime("confirmation_date", { useTz: true });
			table.string("confirmation_origin", 30);
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("confirmation_user_id");
			table.dropColumn("confirmation_conference_date");
			table.dropColumn("confirmation_date");
			table.dropColumn("confirmation_origin");
		});
	}
}
