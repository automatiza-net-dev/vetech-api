import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";

export default class DreCostPlanningItem extends BaseModel {
	@column({
		serializeAs: null,
	})
	public id: number;

	@column({
		consume: (value) => (value ? new Decimal(value) : new Decimal(0)),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
	})
	public cost: Decimal;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

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
	public dre_cost_planning_id: number;

	@column({
		serializeAs: null,
	})
	public account_plan_id: string;

	@column({
		serializeAs: null,
	})
	public create_user_id: string;

	@column({
		serializeAs: null,
	})
	public delete_user_id: string | null;
}
