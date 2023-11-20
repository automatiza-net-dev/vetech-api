import {
	BaseModel,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import BusinessUnit from "App/Models/BusinessUnit";
import Patient from "App/Models/Patient";
import ReceiptItem from "App/Models/ReceiptItem";
import ReceiptPayment from "App/Models/ReceiptPayment";
import User from "App/Models/User";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export const ReceiptStatus = ["Ativa", "Estornada"] as const;
export type TReceiptStatus = typeof ReceiptStatus[number];

export default class Receipt extends BaseModel {
	@column({ isPrimary: true })
	public id = v4();

	@column()
	public tag: string;

	@column.dateTime({
		columnName: "issue_date",
	})
	public issueDate: DateTime;

	@column.dateTime({
		columnName: "receipt_date",
	})
	public receiptDate: DateTime | null;

	@column({
		columnName: "product_value",
	})
	public productValue: number;

	@column({
		columnName: "service_value",
	})
	public serviceValue: number;

	@column({
		columnName: "discount_value",
	})
	public discountValue: number;

	@column({
		columnName: "delivery_value",
	})
	public deliveryValue: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column({
		columnName: "icms_base",
	})
	public icmsBase: number;

	@column({
		columnName: "icms_value",
	})
	public icmsValue: number;

	@column({
		columnName: "icms_st_base",
	})
	public icmsStBase: number;

	@column({
		columnName: "icms_st_value",
	})
	public icmsStValue: number;

	@column({
		columnName: "iss_base",
	})
	public issBase: number;

	@column({
		columnName: "iss_value",
	})
	public issValue: number;

	@column({
		columnName: "pis_base",
	})
	public pisBase: number;

	@column({
		columnName: "pis_value",
	})
	public pisValue: number;

	@column({
		columnName: "pis_retention_value",
	})
	public pisRetentionValue: number;

	@column({
		columnName: "cofins_base",
	})
	public cofinsBase: number;

	@column({
		columnName: "cofins_value",
	})
	public cofinsValue: number;

	@column({
		columnName: "cofins_retention_value",
	})
	public cofinsRetentionValue: number;

	@column({
		columnName: "ipi_base",
	})
	public ipiBase: number;

	@column({
		columnName: "ipi_value",
	})
	public ipiValue: number;

	@column({
		columnName: "icms_deferred_value",
	})
	public icmsDeferredValue: number;

	@column({
		columnName: "icms_fcp_value",
	})
	public icmsFcpValue: number;

	@column({
		columnName: "icms_uf_origin_value",
	})
	public icmsUfOriginValue: number;

	@column({
		columnName: "icms_uf_destination_value",
	})
	public icmsUfDestinationValue: number;

	@column({
		columnName: "other_value",
	})
	public otherValue: number;

	@column({
		columnName: "additional_information",
	})
	public additionalInformation: string;

	@column({
		columnName: "reversed_at",
	})
	public reversedAt: DateTime | null;

	@column({
		columnName: "reversal_observation",
	})
	public reversalObservation: string | null;

	@column()
	public status: TReceiptStatus;

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
	public businessUnit: BelongsTo<typeof BusinessUnit>;

	@column({
		serializeAs: null,
	})
	public supplier_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "supplier_id",
	})
	public supplier: BelongsTo<typeof Patient>;

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
	public seller_id: string;

	@belongsTo(() => User, {
		foreignKey: "seller_id",
	})
	public seller: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public daily_movement_id: string;

	@column({
		serializeAs: null,
	})
	public daily_cashier_id: string;

	@column({
		serializeAs: null,
	})
	public reversal_user_id: string;

	@column({
		serializeAs: null,
	})
	public reversal_reason_id: string;

	@hasMany(() => ReceiptPayment, {
		foreignKey: "receipt_id",
	})
	public payments: HasMany<typeof ReceiptPayment>;

	@hasMany(() => ReceiptItem, {
		foreignKey: "receipt_id",
	})
	public items: HasMany<typeof ReceiptItem>;
}
