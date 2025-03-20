import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class KanbanUser extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deletedAt: DateTime | null;

	@column({ serializeAs: null })
	public kanban_id: number;

	@column({ serializeAs: null })
	public user_id: string;

	@column({ serializeAs: null })
	public user_creation_id: string;

	@column({ serializeAs: null })
	public user_updated_id: string;

	@column({ serializeAs: null })
	public exclusion_user_id: string;
}
