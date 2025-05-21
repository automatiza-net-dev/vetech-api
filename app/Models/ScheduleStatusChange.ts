import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Reason from "App/Models/Reason";
import ScheduleStatus from "App/Models/ScheduleStatus";
import User from "App/Models/User";
import { DateTime } from "luxon";

export default class ScheduleStatusChange extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public observation: string;

	@column.dateTime({
		columnName: "confirmation_date",
		serializeAs: "confirmationDate",
	})
	public confirmationDate: DateTime | null;

	@column.dateTime({
		columnName: "finance_pending_authorized_at",
		serializeAs: "financePendingAuthorizedAt",
	})
	public financePendingAuthorizedAt: DateTime | null;

	@column.dateTime({
		columnName: "confirmation_conference_date",
		serializeAs: "confirmationConferenceDate",
	})
	public confirmationConferenceDate: DateTime | null;

	@column({
		columnName: "confirmation_origin",
		serializeAs: "confirmationOrigin",
	})
	public confirmationOrigin: "usuario" | "externa" | null;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public schedule_id: string;

	@column({
		serializeAs: null,
	})
	public schedule_status_id: string;

	@belongsTo(() => ScheduleStatus, {
		foreignKey: "schedule_status_id",
	})
	public status: BelongsTo<typeof ScheduleStatus>;

	@column({
		serializeAs: null,
	})
	public user_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public reason_id: string;

	@belongsTo(() => Reason, {
		foreignKey: "reason_id",
	})
	public reason: BelongsTo<typeof Reason>;

	@column({
		serializeAs: null,
	})
	public confirmation_user_id: string | null;

	@column({
		serializeAs: null,
	})
	public finance_pending_authorization_user_id: string | null;

	// table.dropColumn("");
	// table.dropColumn("");
}
