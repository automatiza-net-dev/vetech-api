import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import Budget from "./Budget";
import TefFlag from "./TefFlag";
import TefAcquirer from "./TefAcquirer";
import PaymentMethod from "./PaymentMethod";
import User from "./User";

export const BudgetPaymentStatus = ["Aberto", "Excluido"] as const;
export type TBudgetPaymentStatus = (typeof BudgetPaymentStatus)[number];

export const BudgetPaymentExclusionOrigin = ["Venda", "Orçamento"] as const;
export type TBudgetPaymentExclusionOrigin =
	(typeof BudgetPaymentExclusionOrigin)[number];

export default class BudgetPayment extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public block: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column()
	public installments: number;

	@column()
	public status: TBudgetPaymentStatus;

	@column.dateTime({
		columnName: "confirmation_date",
	})
	public confirmationDate: DateTime | null;

	@column({
		columnName: "exclusion_origin",
	})
	public exclusionOrigin: TBudgetPaymentExclusionOrigin | null;

	@column.dateTime({ columnName: "issue_date" })
	public issueDate: DateTime;

	@column.dateTime({ columnName: "update_date" })
	public updateDate: DateTime | null;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
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

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public budget_id: string;

	@belongsTo(() => Budget, {
		foreignKey: "budget_id",
	})
	public budget: BelongsTo<typeof Budget>;

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
	public tef_acquirer_id: string;

	@belongsTo(() => TefAcquirer, {
		foreignKey: "tef_acquirer_id",
	})
	public tefAcquirer: BelongsTo<typeof TefAcquirer>;

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
	public user_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public change_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "change_user_id",
	})
	public changeUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public conclusion_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "conclusion_user_id",
	})
	public conclusionUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "exclusion_user_id",
	})
	public exclusionUser: BelongsTo<typeof User>;
}
