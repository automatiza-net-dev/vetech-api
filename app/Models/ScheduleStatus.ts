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
import EconomicGroup from "App/Models/EconomicGroup";
import Schedule from "App/Models/Schedule";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export const SS_NOT_CONFIRMED = "982ab03a-c747-4296-89ba-44d3e359064e";
export const SS_CONFIRMED = "7940c391-fb29-48a8-b12c-a54c90f429bf";
export const SS_RECEPTION = "c8d04207-3666-4c40-bf5a-f80bc1cd2357";
export const SS_ON_ATTENDANCE = "c044b0de-dbf2-43d8-9184-215e517afaba";
export const SS_ATTENDANCE_FINISHED = "d4caeeb9-c101-4187-a0e1-76ce6fdf7191";
export const SS_ATTENDANCE_CANCELLED = "d1a58af6-748c-4966-85d2-8ef21c891ccc";
export const SS_SURGERY = "796b9b07-a746-47d0-a93a-da7154869773";
export const SS_HOSPITALIZED = "07cfeb17-192e-4196-a0d5-f33d3240a736";
export const SS_ON_NOTE = "3aad3eec-4cb0-4295-9840-5c584cb1040d";
export const SS_LATE = "e5fbc62e-9f66-428c-ba05-1ecf6a0fb388";

export const ScheduleStatusTypes = [
	"AC",
	"AN",
	"CANC",
	"FIN",
	"ATR",
	"ATEND",
	"CIR",
	"OBS",
	"INT",
	"REC",
	"FAL",
] as const;
export type ScheduleStatusType = (typeof ScheduleStatusTypes)[number];

export const VALID_CHANGES = {
	AN: ["AC", "REC", "ATR", "CANC"],
	AC: ["REC", "CIR", "CANC", "ATR"],
	REC: ["ATEND", "CIR", "INT", "OBS", "CANC"],
	ATEND: ["FIN", "CIR", "INT", "OBS"],
	CIR: ["FIN", "INT", "OBS"],
	INT: ["FIN", "OBS", "CIR"],
	OBS: ["FIN", "CIR", "INT"],
	ATR: ["ATEND", "CIR", "INT", "OBS", "CANC"],
} as const;

export default class ScheduleStatus extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public description: string;

	@column()
	public color: string;

	@column()
	public type: ScheduleStatusType;

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

	@column()
	public economic_group_id?: string;

	@belongsTo(() => EconomicGroup)
	public economicGroup: BelongsTo<typeof EconomicGroup>;

	@hasMany(() => Schedule, {
		localKey: "id",
		foreignKey: "schedule_status_id",
	})
	public schedules: HasMany<typeof Schedule>;
}
