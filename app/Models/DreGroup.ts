import { DateTime } from "luxon";
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
import User from "./User";
import DreCostPlanning from "./DreCostPlanning";

export default class DreGroup extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public sequence: number;

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
	public system_id: number;

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

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

	@belongsTo(() => User, {
		foreignKey: "create_user_id",
	})
	public createUser: BelongsTo<typeof User>;

	@belongsTo(() => User, {
		foreignKey: "update_user_id",
	})
	public updateUser: BelongsTo<typeof User>;

  @hasMany(() => DreCostPlanning, {
    foreignKey: "dre_group_id",
  })
  public dreCostPlannings: HasMany<typeof DreCostPlanning>;
}
