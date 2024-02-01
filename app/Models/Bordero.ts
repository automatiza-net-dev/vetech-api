import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import { v4 } from "uuid";
import Finance from "./Finance";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import BusinessUnit from "./BusinessUnit";
import EconomicGroup from "./EconomicGroup";
import Patient from "./Patient";
import DailyMovement from "./DailyMovement";
import AccountPlan from "./AccountPlan";
import CheckingAccount from "./CheckingAccount";
import PaymentMethod from "./PaymentMethod";
import Banking from "./Banking";
import TefFlag from "./TefFlag";
import User from "./User";

export const BorderoType = ["Debito", "Credito"] as const;
export type TBorderoType = (typeof BorderoType)[number];

export const BorderoStatus = [
	"Aberto",
	"Fechado",
	"Baixado",
	"Excluido",
] as const;
export type TBorderoStatus = (typeof BorderoStatus)[number];

export default class Bordero extends BaseModel {
	@column({ isPrimary: true })
	public id = v4();

	@column()
	public type: TBorderoType;

	@column()
	public document: string;

	@column({
		columnName: "nsu_document",
	})
	public nsuDocument: string;

	@column({
		columnName: "titles_qty",
	})
	public titlesQty: number;

	@column()
	public description: string;

	@column()
	public history: string;

	@column({
		columnName: "expiration_date",
	})
	public expirationDate: DateTime;

	@column({
		columnName: "competence_date",
	})
	public competenceDate: string;

	@column.dateTime({
		columnName: "issue_date",
	})
	public issueDate: DateTime;

	@column.dateTime({
		columnName: "bordero_date",
	})
	public borderoDate: DateTime;

	@column.dateTime({
		columnName: "payment_date",
	})
	public paymentDate: DateTime;

	@column.dateTime({
		columnName: "down_date",
	})
	public downDate: DateTime;

	@column({
		columnName: "bordero_value",
	})
	public borderoValue: number;

	@column({
		columnName: "interest_value",
	})
	public interestValue: number;

	@column({
		columnName: "interest_percentage",
	})
	public interestPercentage: number;

	@column({
		columnName: "discount_value",
	})
	public discountValue: number;

	@column({
		columnName: "discount_percentage",
	})
	public discountPercentage: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column({
		columnName: "payment_value",
	})
	public paymentValue: number;

	@column()
	public observation: string;

	@column({
		columnName: "reason_for_reversal",
	})
	public reasonForReversal: string;

	@column()
	public status: TBorderoStatus;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({})
	public deletedAt: DateTime;

	@beforeFind()
	public static softDeletesFind = softDeleteQuery;

	@beforeFetch()
	public static softDeletesFetch = softDeleteQuery;

	public async softDelete(column?: string) {
		await softDelete(this, column);
	}

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@belongsTo(() => EconomicGroup, {
		foreignKey: "economic_group_id",
	})
	public economicGroup: BelongsTo<typeof EconomicGroup>;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
	})
	public unit: BelongsTo<typeof BusinessUnit>;

	@column({
		serializeAs: null,
	})
	public daily_movement_id: string;

	@belongsTo(() => DailyMovement, {
		foreignKey: "daily_movement_id",
	})
	public dailyMovement: BelongsTo<typeof DailyMovement>;

	@column({
		serializeAs: null,
	})
	public account_plan_id: string;

	@belongsTo(() => AccountPlan, {
		foreignKey: "account_plan_id",
	})
	public accountPlan: BelongsTo<typeof AccountPlan>;

	@column({
		serializeAs: null,
	})
	public checking_account_id: string;

	@belongsTo(() => CheckingAccount, {
		foreignKey: "checking_account_id",
	})
	public checkingAccount: BelongsTo<typeof CheckingAccount>;

	@column({
		serializeAs: null,
	})
	public bank_statement_id: string;

	@belongsTo(() => Banking, {
		foreignKey: "bank_statement_id",
	})
	public bankStatement: BelongsTo<typeof Banking>;

	@column({
		serializeAs: null,
	})
	public payment_method_id: string;

	@belongsTo(() => PaymentMethod, {
		foreignKey: "payment_method_id",
	})
	public paymentMethod: BelongsTo<typeof PaymentMethod>;

	@column({
		serializeAs: null,
	})
	public client_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "client_id",
	})
	public client: BelongsTo<typeof Patient>;

	@column({
		serializeAs: null,
	})
	public tef_flag_id: string;

	@belongsTo(() => TefFlag, {
		foreignKey: "tef_flag_id",
	})
	public tefFlag: BelongsTo<typeof TefFlag>;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "exclusion_user_id",
	})
	public exclusionUser: BelongsTo<typeof User>;

	@hasMany(() => Finance, {
		foreignKey: "bordero_id",
	})
	public finances: HasMany<typeof Finance>;
}
