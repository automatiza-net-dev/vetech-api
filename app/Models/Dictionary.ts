import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class Dictionary extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public lang: string;

	@column()
	public client: string;

	@column()
	public key: string;

	@column()
	public word: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;
}
