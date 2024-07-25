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

	@column({
		serializeAs: null,
	})
	public role_id: number;

	@belongsTo(() => User, {})
	public user: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public user_id?: string;

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
