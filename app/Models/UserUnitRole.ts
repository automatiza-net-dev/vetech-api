import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import BusinessUnit from "App/Models/BusinessUnit";
import Role from "App/Models/Role";
import User from "App/Models/User";
import { DateTime } from "luxon";
import Deposit from "./Deposit";

export default class UserUnitRole extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public user_id: string;

	@column()
	public unit_id: string | null;

	@column()
	public role_id: number;

	@column()
	public default_sale_deposit_id: number;

	@column()
	public active: boolean;

	@belongsTo(() => User, {
		localKey: "id",
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@belongsTo(() => BusinessUnit, {
		localKey: "id",
		foreignKey: "unit_id",
	})
	public unit: BelongsTo<typeof BusinessUnit>;

	@belongsTo(() => Role, {
		localKey: "id",
		foreignKey: "role_id",
	})
	public role: BelongsTo<typeof Role>;

	@belongsTo(() => Deposit, {
		localKey: "id",
		foreignKey: "default_sale_deposit_id",
	})
	public deposit: BelongsTo<typeof Deposit>;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;
}
