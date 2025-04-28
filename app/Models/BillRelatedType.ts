import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDeleteQuery } from "App/Services/SoftDelete";

export default class BillRelatedType extends BaseModel {
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

	@column.dateTime({})
	public deletedAt: DateTime | null;

	@beforeFind()
	public static softDeletesFind = softDeleteQuery;

	@beforeFetch()
	public static softDeletesFetch = softDeleteQuery;

	@column({ serializeAs: null })
	public system_id: number;

	@column({ serializeAs: null })
	public economic_group_id: string | null;

	@column({ serializeAs: null })
	public creation_user_id: string;

	@column({ serializeAs: null })
	public update_user_id: string | null;

	@column({ serializeAs: null })
	public exclusion_user_id: string | null;
}
