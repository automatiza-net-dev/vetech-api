import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "notification_users";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table
				.integer("notification_id")
				.notNullable()
				.unsigned()
				.references("notifications.id");
			table.uuid("user_id").notNullable().references("users.id");

			table.timestamp("viewed_at", { useTz: true });
			table.timestamp("read_at", { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
