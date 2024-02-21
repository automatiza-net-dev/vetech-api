import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export const ProfileAccessType = [
	"system",
	"controller",
	"user",
	"both",
	"all",
] as const;
export type TProfileAccessType = (typeof ProfileAccessType)[number];

export default class ProfileAccess extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public system_id: number;
}
