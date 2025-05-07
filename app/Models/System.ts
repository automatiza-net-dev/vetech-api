import { BaseModel, HasMany, column, hasMany } from "@ioc:Adonis/Lucid/Orm";
import SystemUrl from "App/Models/SystemUrl";
import { DateTime } from "luxon";

export default class System extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public name: string;

	@column()
	public active: boolean;

	@column({})
	public type: string;

	@column({
		columnName: "email_schedule_confirmation",
		serializeAs: "emailScheduleConfirmation",
	})
	public emailScheduleConfirmation: string | null;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@hasMany(() => SystemUrl, {
		foreignKey: "system_id",
	})
	public systemUrls: HasMany<typeof SystemUrl>;

	@column({ serializeAs: null })
	public default_role_id: number;
}
