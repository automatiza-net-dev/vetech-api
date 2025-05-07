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

export default class BillItemDepartment extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public observations: string;

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
	public bill_id: string;

	@column({
		serializeAs: null,
	})
	public bill_item_id: string;

	@column({
		serializeAs: null,
	})
	public department_id: number;

	@column({
		serializeAs: null,
	})
	public department_item_id: number;

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
