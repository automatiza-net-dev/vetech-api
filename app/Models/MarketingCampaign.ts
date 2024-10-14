import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import MarketingCampaignClientOrigin from "./MarketingCampaignClientOrigin";
import Opportunity from "./Opportunity";
import User from "./User";

export default class MarketingCampaign extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column({
		columnName: "investment_value",
		serializeAs: "investmentValue",
		consume: (value) => (value ? new Decimal(value) : new Decimal(0)),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
	})
	public investmentValue: Decimal;

	@column({
		columnName: "start_date",
		serializeAs: "startDate",
	})
	public startDate: string;

	@column({
		columnName: "end_date",
		serializeAs: "endDate",
	})
	public endDate: string;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({
		serializeAs: null,
	})
	public deletedAt: DateTime;

	@beforeFind()
	public static softDeletesFind = softDeleteQuery;

	@beforeFetch()
	public static softDeletesFetch = softDeleteQuery;

	public async softDelete(column?: string) {
		await softDelete(this, column);
	}

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
	public create_user_id: string;

	@column({
		serializeAs: null,
	})
	public update_user_id: string | null;

	@column({
		serializeAs: null,
	})
	public delete_user_id: string | null;

	@hasMany(() => MarketingCampaignClientOrigin, {
		foreignKey: "marketing_campaign_id",
	})
	clientOrigins: HasMany<typeof MarketingCampaignClientOrigin>;

	@hasMany(() => Opportunity, {
		foreignKey: "marketing_campaign_id",
	})
	opportunities: HasMany<typeof Opportunity>;

	@belongsTo(() => User, {
		foreignKey: "create_user_id",
	})
	createUser: BelongsTo<typeof User>;

  @belongsTo(() => User, {
		foreignKey: "update_user_id",
	})
	updateUser: BelongsTo<typeof User>;
}
