import { DateTime } from "luxon";
import {
	BaseModel,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import DepositMovementItem from "./DepositMovementItem";
import EconomicGroup from "./EconomicGroup";
import User from "./User";
import Deposit from "./Deposit";
import BusinessUnit from "./BusinessUnit";

export const DepositMovementStatus = ["Ativo", "Inativo"] as const;
export type TDepositMovementStatus = typeof DepositMovementStatus[number];

export default class DepositMovement extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column.dateTime()
	public date: DateTime;

	@column()
	public status: TDepositMovementStatus;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public user_id: string;

	@column({
		serializeAs: null,
	})
	public responsible_user_id: string;

	@column({
		serializeAs: null,
	})
	public removal_user_id: string;

	@column({
		serializeAs: null,
	})
	public from_deposit_id: number;

	@column({
		serializeAs: null,
	})
	public to_deposit_id: number;

	@hasMany(() => DepositMovementItem, {
		foreignKey: "deposit_movement_id",
	})
	public items: HasMany<typeof DepositMovementItem>;

	@belongsTo(() => EconomicGroup, {
		foreignKey: "economic_group_id",
	})
	public group: BelongsTo<typeof EconomicGroup>;

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
	})
	public unit: BelongsTo<typeof BusinessUnit>;

	@belongsTo(() => User, {
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@belongsTo(() => User, {
		foreignKey: "responsible_user_id",
	})
	public responsibleUser: BelongsTo<typeof User>;

	@belongsTo(() => User, {
		foreignKey: "removal_user_id",
	})
	public removalUser: BelongsTo<typeof User>;

	@belongsTo(() => Deposit, {
		foreignKey: "from_deposit_id",
	})
	public fromDeposit: BelongsTo<typeof Deposit>;

	@belongsTo(() => Deposit, {
		foreignKey: "to_deposit_id",
	})
	public toDeposit: BelongsTo<typeof Deposit>;
}
