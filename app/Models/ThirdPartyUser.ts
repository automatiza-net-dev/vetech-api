import { DateTime } from "luxon";
import { BaseModel, column, computed } from "@ioc:Adonis/Lucid/Orm";
import { v4 } from "uuid";

export default class ThirdPartyUser extends BaseModel {
	@column({ isPrimary: true })
	public id = v4();

	@column()
	public name: string;

	@column()
	public active: boolean;

	@computed()
	public get type() {
		return "user";
	}

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({})
	public disabledAt: DateTime | null;
}
