import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import Decimal from "decimal.js";
import { softDeleteQuery } from "App/Services/SoftDelete";

export default class BillCancelation extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public cancelled: "P";

	@column({
		columnName: "cancel_reason",
		serializeAs: "cancelReason",
	})
	public cancelReason: string | null;

	@column({
		columnName: "cancel_notes",
		serializeAs: "cancelNotes",
	})
	public cancelNotes: string | null;

	@column({
		columnName: "cancel_value_products",
		serializeAs: "cancelValueProducts",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => (value ? value.toString() : null),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public cancelValueProducts: Decimal | null;

	@column({
		columnName: "cancel_value_services",
		serializeAs: "cancelValueServices",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => (value ? value.toString() : null),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public cancelValueServices: Decimal | null;

	@column({
		columnName: "cancel_value_total",
		serializeAs: "cancelValueTotal",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => (value ? value.toString() : null),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public cancelValueTotal: Decimal | null;

	@column.dateTime({
		columnName: "cancel_date",
		serializeAs: "cancelDate",
	})
	public cancelDate: DateTime | null;

	@column.dateTime({
		columnName: "finish_cancel_date",
		serializeAs: "finishCancelDate",
	})
	public finishCancelDate: DateTime | null;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deletedAt: DateTime | null;

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
	public cancel_user_id: string;

	@column({
		serializeAs: null,
	})
	public cancel_reason_id: string | null;

	@column({
		serializeAs: null,
	})
	public finish_cancel_user_id: string;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@column({
		serializeAs: null,
	})
	public deposit_id: number | null;
}
