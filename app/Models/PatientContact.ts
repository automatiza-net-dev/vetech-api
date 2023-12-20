import { DateTime } from "luxon";
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Patient from "./Patient";

export const PatientContactType = [
	"email",
	"celular",
	"residencial",
	"comercial",
	"recado",
] as const;

export default class PatientContact extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public main: boolean;

	@column()
	public contact: string;

	@column()
	public observation: string;

	@column()
	public type: (typeof PatientContactType)[number];

	@column({
		columnName: "not_given",
	})
	public notGiven: boolean;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public patient_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "patient_id",
	})
	public patient: BelongsTo<typeof Patient>;
}
