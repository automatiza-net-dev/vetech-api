import Env from "@ioc:Adonis/Core/Env";
import { BaseModel, HasMany, column, hasMany } from "@ioc:Adonis/Lucid/Orm";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import { axiom } from "App/Lib/Axiom";
import SystemUrl from "App/Models/SystemUrl";
import { DateTime } from "luxon";
import { ConfigSchema, TConfigSchema } from "./BusinessUnitConfig";

export default class System extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public name: string;

	@column()
	public active: boolean;

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
