import { DateTime } from "luxon";
import { BaseModel, column, HasMany, hasMany } from "@ioc:Adonis/Lucid/Orm";
import ClientOriginGroup from "./ClientOriginGroup";

export default class ClientOriginCategory extends BaseModel {
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

	@hasMany(() => ClientOriginGroup, {
		foreignKey: "client_origin_category_id",
	})
	public groups: HasMany<typeof ClientOriginGroup>;
}
