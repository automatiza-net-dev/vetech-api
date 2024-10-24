import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import BusinessUnit from "App/Models/BusinessUnit";
import User from "App/Models/User";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import Role from "./Role";

export default class Invite extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
		localKey: "id",
	})
	public businessUnit: BelongsTo<typeof BusinessUnit>;

	@column({
		serializeAs: "businessUnitId",
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@belongsTo(() => Role, {
		foreignKey: "role_id",
	})
	public role: BelongsTo<typeof Role>;

	@column({
		serializeAs: "roleId",
	})
	public role_id: number;

	@belongsTo(() => User, {
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public user_id?: string;

	@belongsTo(() => User, {
		foreignKey: "invitedBy",
	})
	public invitedBy: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public invited_by_user_id: string | null;

	@column()
	public email: string;

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

	public async softDelete(column?: string) {
		await softDelete(this, column);
	}
}
