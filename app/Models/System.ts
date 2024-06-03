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

	@column({
		columnName: "colors",
		consume: (rawVal: string) => {
			return rawVal.split(",");
		},
		prepare: (value: string[]) => {
			return value.join(",");
		},
	})
	public colors: string[];

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
