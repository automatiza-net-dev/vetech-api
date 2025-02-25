import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDeleteQuery } from "App/Services/SoftDelete";
import User from "./User";

export default class DepartmentItem extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public photo: string | null;

	@column({
		columnName: "requires_oservation",
		serializeAs: "requiresObservation",
	})
	public requiresObservation: boolean;

	@column()
	public order: number;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deletedAt: DateTime;

	@beforeFind()
	public static softDeletesFind = softDeleteQuery;

	@beforeFetch()
	public static softDeletesFetch = softDeleteQuery;

	@column({
		serializeAs: null,
	})
	public department_id: number;

	@column({
		serializeAs: null,
	})
	public creation_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "creation_user_id",
	})
	public creationUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public updated_user_id: string | null;

	@belongsTo(() => User, {
		foreignKey: "updated_user_id",
	})
	public updatedUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public deleted_user_id: string | null;

	@belongsTo(() => User, {
		foreignKey: "deleted_user_id",
	})
	public deletedUser: BelongsTo<typeof User>;
}
