import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class S3Cache extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public key: string;

	@column()
	public value: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({})
	public expiresAt: DateTime;
}
