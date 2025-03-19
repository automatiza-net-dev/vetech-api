import {
	BaseModel,
	BelongsTo,
	belongsTo,
	column,
	HasOne,
	hasOne,
} from "@ioc:Adonis/Lucid/Orm";
import Bill from "App/Models/Bill";
import PaymentMethod from "App/Models/PaymentMethod";
import TefAcquirer from "App/Models/TefAcquirer";
import TefFlag from "App/Models/TefFlag";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import Finance from "App/Models/Finance";
import User from "App/Models/User";

export enum BillPaymentFeeType {
	S = "COM_JUROS",
	N = "SEM_JUROS",
}

export default class BillPayment extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public block: number;

	@column.dateTime({
		columnName: "expiration_date",
	})
	public expirationDate: DateTime;

	@column.dateTime({
		columnName: "conference_date",
	})
	public conferenceDate: DateTime;

	@column({
		columnName: "fee_type",
	})
	public feeType: BillPaymentFeeType;

	@column({
		columnName: "fee_value",
	})
	public feeValue: number;

	@column({
		columnName: "fee_percentage",
	})
	public feePercentage: number;

	@column({
		columnName: "installment_value",
	})
	public installmentValue: number;

	@column({
		columnName: "payment_method_discount_percentage",
	})
	public paymentMethodDiscountPercentage: number;

	@column({
		columnName: "payment_method_discount_value",
	})
	public paymentMethodDiscountValue: number;

	@column()
	public installments: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column({
		columnName: "qty_installments",
	})
	public qtyInstallments: number;

	@column()
	public status: string;

	@column({
		columnName: "nsu_document",
	})
	public nsuDocument: string;

	@column()
	public reason: string | null;

	@column()
	public pending: boolean;

	@column()
	public approved: boolean;

	@column.dateTime({})
	public approvedAt: DateTime | null;

	@column.dateTime({})
	public printedAt: DateTime | null;

	@column({})
	public cancelled: "P" | "N" | "S" | null;

	@column.dateTime({
		columnName: "review_cancel_date",
		serializeAs: "reviewCancelDate",
	})
	public reviewCancelDate: DateTime | null;

	@column({
		columnName: "review_cancel_notes",
		serializeAs: "reviewCancelNotes",
	})
	public reviewCancelNotes: string | null;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deletedAt: DateTime | null;

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
	public approved_user_id: string | null;

	@belongsTo(() => User, {
		foreignKey: "approved_user_id",
	})
	public approvedUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public user_id: string;

	@column({
		serializeAs: null,
	})
	public print_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "print_user_id",
	})
	public printUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public daily_cashier_id: string;

	@column({
		serializeAs: null,
	})
	public bill_id: string;

	@belongsTo(() => Bill, {
		foreignKey: "bill_id",
	})
	public bill: BelongsTo<typeof Bill>;

	@column({
		serializeAs: null,
	})
	public payment_method_id: string | null;

	@belongsTo(() => PaymentMethod, {
		foreignKey: "payment_method_id",
	})
	public paymentMethod: BelongsTo<typeof PaymentMethod>;

	@column({
		serializeAs: null,
	})
	public tef_flag_id: string;

	@belongsTo(() => TefFlag, {
		foreignKey: "tef_flag_id",
	})
	public flag: BelongsTo<typeof TefFlag>;

	@column({
		serializeAs: null,
	})
	public tef_acquirer_id: string;

	@belongsTo(() => TefAcquirer, {
		foreignKey: "tef_acquirer_id",
	})
	public acquirer: BelongsTo<typeof TefAcquirer>;

	@hasOne(() => Finance, {
		foreignKey: "origin_id",
	})
	public finance: HasOne<typeof Finance>;

	@column({
		serializeAs: null,
	})
	public budget_payment_id: number | null;

	@column({
		serializeAs: null,
	})
	public reviewer_cancel_user_id: string | null;

	@belongsTo(() => User, {
		foreignKey: "reviewer_cancel_user_id",
	})
	public reviewerCancelUser: BelongsTo<typeof User>;
}
