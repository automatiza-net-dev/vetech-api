import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class NotificationUser extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column.dateTime({ columnName: "viewed_at" })
	public viewedAt: DateTime | null;

	@column.dateTime({ columnName: "read_at" })
	public readAt: DateTime | null;

	@column({
		serializeAs: null,
	})
	public notification_id: number;

	@column({
		serializeAs: null,
	})
	public user_id: string;
}
