import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import ClientOrigin from "./ClientOrigin";

export default class MarketingCampaignClientOrigin extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public marketing_campaign_id: number;

	@column({
		serializeAs: null,
	})
	public client_origin_id: string;

	@belongsTo(() => ClientOrigin, {
		foreignKey: "client_origin_id",
	})
	clientOrigin: BelongsTo<typeof ClientOrigin>;
}
