import { DateTime } from "luxon";
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import ProfileAccess from "App/Models/ProfileAccess";

export default class RoleProfileAccess extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public active: boolean;

	@column()
	public type: string | null;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column({
		serializeAs: null,
	})
	public role_id: number;

	@column({
		serializeAs: null,
	})
	public profile_access_id: number;

	@belongsTo(() => ProfileAccess, {
		foreignKey: "profile_access_id",
		localKey: "id",
	})
	public profile: BelongsTo<typeof ProfileAccess>;
}
