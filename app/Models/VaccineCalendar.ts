import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import PatientVaccine from "App/Models/PatientVaccine";
import Product from "App/Models/Product";
import Schedule from "App/Models/Schedule";
import User from "App/Models/User";
import { softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export default class VaccineCalendar extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column.dateTime({
		columnName: "scheduling_date",
	})
	public schedulingDate: DateTime;

	@column.dateTime({
		columnName: "application_date",
	})
	public applicationDate: DateTime | null;

	@column()
	public dose: number;

	@column()
	public laboratory: string | null;

	@column()
	public batch: string | null;

	@column({
		columnName: "applied_outside",
		serializeAs: "appliedOutside",
	})
	public appliedOutside: boolean;

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

	@column()
	public patient_vaccine_id: string;

	@belongsTo(() => PatientVaccine, {
		foreignKey: "patient_vaccine_id",
	})
	public patientVaccine: BelongsTo<typeof PatientVaccine>;

	@column()
	public schedule_id: string;

	@belongsTo(() => Schedule, {
		foreignKey: "schedule_id",
	})
	public schedule: BelongsTo<typeof Schedule>;

	@column()
	public user_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@column()
	public product_id: string | null;

	@belongsTo(() => Product, {
		foreignKey: "product_id",
	})
	public product: BelongsTo<typeof Product>;
}
