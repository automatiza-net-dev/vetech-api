import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "screens";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer("screen_id").references("screens.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("screen_id");
		});
	}
}
