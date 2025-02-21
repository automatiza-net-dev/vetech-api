import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";

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

	@column({
		serializeAs: null,
	})
	public updated_user_id: string | null;

	@column({
		serializeAs: null,
	})
	public deleted_user_id: string | null;
}
