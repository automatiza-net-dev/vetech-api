import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";

export default class DreCostPlanning extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public period: string;

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
	public business_unit_id: string;

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
}
