import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "opportunities";

	public async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table
				.integer("marketing_campaign_id")
				.references("marketing_campaigns.id");
		});
	}

	public async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn("marketing_campaign_id");
		});
	}
}
