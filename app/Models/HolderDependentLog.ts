import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class HolderDependentLog extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public exclusion_user_id: string;

	@column()
	public holder_id: string;

	@column()
	public dependent_id: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({})
	public deletedAt: DateTime;
}
