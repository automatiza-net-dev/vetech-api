import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { DateTime } from "luxon";

export default class TreatmentExecutionReschedule extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "evaluation_id",
	})
	public evaluationId: string;

	@column.dateTime()
	public scheduleDate: DateTime;

	@column.dateTime()
	public rescheduleDate: DateTime;

	@column()
	public observations: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

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
	public treatment_id: number;

	@column({
		serializeAs: null,
	})
	public treatment_item_id: number;

	@column({
		serializeAs: null,
	})
	public treatment_item_execution_id: number;

	@column({
		serializeAs: null,
	})
	public schedule_user_id: string;

	@column({
		serializeAs: null,
	})
	public reschedule_user_id: string;

	@column({
		serializeAs: null,
	})
	public reason_id: string;

	@column({
		serializeAs: null,
	})
	public schedule_id: string;
}
