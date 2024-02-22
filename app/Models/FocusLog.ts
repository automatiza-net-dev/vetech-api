import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class FocusLog extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public document_id: string;

	@column()
	public description: string;

	@column()
	public origin: string;

	@column()
	public input: unknown;

	@column()
	public data: unknown;

	@column()
	public error: unknown;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;
}
