import { DateTime } from "luxon";
import {
	BaseModel,
	column,
	HasMany,
	hasMany,
	belongsTo,
	BelongsTo,
} from "@ioc:Adonis/Lucid/Orm";
import KanbanUser from "./KanbanUser";
import User from "./User";

export default class Kanban extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public type: string;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deletedAt: DateTime | null;

	@column({ serializeAs: null })
	public economic_group_id: string;

	@column({ serializeAs: null })
	public business_unit_id: string;

	@column({ serializeAs: null })
	public user_creation_id: string;

	@belongsTo(() => User, {
		localKey: "user_creation_id",
		foreignKey: "id",
	})
	public creationUser: BelongsTo<typeof User>;

	@column({ serializeAs: null })
	public user_updated_id: string;

	@belongsTo(() => User, {
		localKey: "user_updated_id",
		foreignKey: "id",
	})
	public updatedUser: BelongsTo<typeof User>;

	@column({ serializeAs: null })
	public exclusion_user_id: string;

	@belongsTo(() => User, {
		localKey: "user_exclusion_id",
		foreignKey: "id",
	})
	public exclusionUser: BelongsTo<typeof User>;

	@hasMany(() => KanbanUser, {
		foreignKey: "kanban_id",
	})
	public users: HasMany<typeof KanbanUser>;
}
