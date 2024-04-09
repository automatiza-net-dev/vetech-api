import { DateTime } from "luxon";
import { BaseModel, column, HasMany, hasMany } from "@ioc:Adonis/Lucid/Orm";
import ClientOrigin from "./ClientOrigin";

export default class ClientOriginGroup extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({})
	public description: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@column({
		serializeAs: null,
	})
	public economic_group_id?: string;

	@column({
		serializeAs: null,
	})
	public client_origin_category_id: number;

	@hasMany(() => ClientOrigin, {
		foreignKey: "client_origin_group_id",
	})
	public origins: HasMany<typeof ClientOrigin>;
}
