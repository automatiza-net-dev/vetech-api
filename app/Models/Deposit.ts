import { DateTime } from "luxon";
import {
	BaseModel,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import DepositItem from "./DepositItem";
import BusinessUnit from "./BusinessUnit";

export const DepositStatus = ["Ativo", "Inativo"] as const;
export type TDepositStatus = (typeof DepositStatus)[number];

export const DepositType = ["Venda", "Consumo"] as const;
export type TDepositType = (typeof DepositType)[number];

export default class Deposit extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public type: TDepositType;

	@column()
	public status: TDepositStatus;

	@column()
	public principal: boolean;

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

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
	})
	public unit: BelongsTo<typeof BusinessUnit>;

	@hasMany(() => DepositItem, {
		foreignKey: "deposit_id",
	})
	public items: HasMany<typeof DepositItem>;
}
