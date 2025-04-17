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
import BusinessUnit from "App/Models/BusinessUnit";
import Patient from "App/Models/Patient";
import ReceiptItem from "App/Models/ReceiptItem";
import ReceiptPayment from "App/Models/ReceiptPayment";
import User from "App/Models/User";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import EconomicGroup from "./EconomicGroup";

export const ReceiptStatus = [
	"Aberta",
	"Baixada",
	"Estornada",
	"PendenteXml",
	"Excluida",
	"NaoConfirmada",
] as const;
export type TReceiptStatus = (typeof ReceiptStatus)[number];

export const ReceiptOrigin = ["Manual", "Xml"] as const;
export type TReceiptOrigin = (typeof ReceiptOrigin)[number];

export default class Receipt extends BaseModel {
	@column({ isPrimary: true })
	public id = v4();

	@column()
	public tag: string;

	@column()
	public origin: TReceiptOrigin;

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

	@column({
		columnName: "paid_value",
	})
	public paidValue: number;

	@column()
	public status: TReceiptStatus;

	@column({
		columnName: "receipt_type",
		serializeAs: "receiptType",
	})
	public receiptType: "E" | "T" | "D";

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

	@column({
		serializeAs: null,
	})
	public deleted_user_id: string | null;

	@hasMany(() => ReceiptPayment, {
		foreignKey: "receipt_id",
	})
	public payments: HasMany<typeof ReceiptPayment>;

	@hasMany(() => ReceiptItem, {
		foreignKey: "receipt_id",
	})
	public items: HasMany<typeof ReceiptItem>;

	@column({
		serializeAs: null,
	})
	public origin_business_unit_id: string | null;

	@column({
		serializeAs: null,
	})
	public related_bill_id: string | null;
}
