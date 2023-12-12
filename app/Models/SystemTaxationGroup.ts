import { DateTime } from "luxon";
import { BaseModel, column, HasMany, hasMany } from "@ioc:Adonis/Lucid/Orm";
import SystemTaxationGroupRule from "./SystemTaxationGroupRule";

export default class SystemTaxationGroup extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public name: string;

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

	@hasMany(() => SystemTaxationGroupRule, {
		foreignKey: "system_taxation_group_id",
	})
	public rules: HasMany<typeof SystemTaxationGroupRule>;
}
