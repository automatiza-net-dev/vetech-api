import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { DateTime } from "luxon";

export const ScreenType = [
	"system",
	"controller",
	"user",
	"both",
	"all",
] as const;
export type TScreenType = (typeof ScreenType)[number];

export default class Screen extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public name: string;

	@column()
	public type: TScreenType;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public menu_id: number;
}
