import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
	protected tableName = "marketing_campaign_client_origins";

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments("id");

			table.uuid("economic_group_id").references("economic_groups.id");
			table.uuid("business_unit_id").references("business_units.id");
			table
				.integer("marketing_campaign_id")
				.references("marketing_campaigns.id");
			table.uuid("client_origin_id").references("client_origins.id");
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
