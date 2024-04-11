import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "client_origins";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("client_origin_group_id")
				.references("id")
				.inTable("client_origin_groups")
				.onDelete("CASCADE")
				.after("system_d");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("client_origin_group_id");
		});
	}
}
