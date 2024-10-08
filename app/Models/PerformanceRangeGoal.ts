import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";

export default class PerformanceRangeGoal extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "start_value",
		consume: (value) => (value ? new Decimal(value) : new Decimal(0)),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
		serializeAs: "startValue",
	})
	public startValue: Decimal;

	@column({
		columnName: "end_value",
		consume: (value) => (value ? new Decimal(value) : new Decimal(0)),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
		serializeAs: "endValue",
	})
	public endValue: Decimal;

	@column()
	public color: string;

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
	public economic_group_id: string;

	@column({
		serializeAs: null,
	})
	public meta_id: number;

	@column({
		serializeAs: null,
	})
	public create_user_id: string;

	@column({
		serializeAs: null,
	})
	public delete_user_id: string | null;
}
