import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	belongsTo,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import User from "./User";

export default class Department extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

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
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public creation_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'creation_user_id'
  })
  public creationUser: BelongsTo<typeof User>

	@column({
		serializeAs: null,
	})
	public updated_user_id: string | null;

  @belongsTo(() => User, {
    foreignKey: 'updated_user_id'
  })
  public updateUser: BelongsTo<typeof User>

	@column({
		serializeAs: null,
	})
	public deleted_user_id: string | null;
}
