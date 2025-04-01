import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import { DateTime } from "luxon";
import User from "./User";

export const CrmStatusTypes = ["OP", "OPR"] as const;
export type CrmStatusType = (typeof CrmStatusTypes)[number];

export default class CrmStatus extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public tag: string;

	@column()
	public type: CrmStatusType;

	@column()
	public active: boolean;

	@column()
	public order: number;

	@column()
	public ganho: boolean | null;

	@column()
	public perda: boolean | null;

	@column({
		columnName: "sync_schedules",
		serializeAs: "syncSchedules",
	})
	public syncSchedules: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({})
	public deletedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@column({
		serializeAs: null,
	})
	public kanban_id: number | null;

	@column({ serializeAs: null })
	public user_creation_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_creation_id",
	})
	public creationUser: BelongsTo<typeof User>;

	@column({ serializeAs: null })
	public user_updated_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_updated_id",
	})
	public updatedUser: BelongsTo<typeof User>;

	@column({ serializeAs: null })
	public exclusion_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_exclusion_id",
	})
	public exclusionUser: BelongsTo<typeof User>;
}
