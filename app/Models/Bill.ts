import {
	BaseModel,
	beforeFetch,
	beforeFind,
	belongsTo,
	BelongsTo,
	column,
	computed,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import BillItem from "App/Models/BillItem";
import BusinessUnit from "App/Models/BusinessUnit";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import BillDocument from "App/Models/BillDocument";
import BillPayment from "App/Models/BillPayment";
import Budget from "App/Models/Budget";
import EconomicGroup from "App/Models/EconomicGroup";
import Patient from "App/Models/Patient";
import User from "App/Models/User";
import Decimal from "decimal.js";
import Reason from "./Reason";

export enum BillStatus {
	A = "ABERTA",
	E = "EXTORNADA",
	B = "BAIXADA",
	EX = "EXCLUIDA",
}

export const BillDocumentStatus = [
	"Não Gerados",
	"Gerados",
	"Imp. Pendentes",
	"Impressos",
	"Novos Itens",
] as const;
export type TBillDocumentStatus = (typeof BillDocumentStatus)[number];

export default class Bill extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public tag: string;

	@column.dateTime({
		columnName: "bill_date",
	})
	public billDate: DateTime;

	@column.dateTime({
		columnName: "closing_date",
	})
	public closingDate: DateTime;

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
		columnName: "fee_value",
	})
	public feeValue: number;

	@column({
		columnName: "delivery_value",
	})
	public deliveryValue: number;

	@column({
		columnName: "paid_value",
	})
	public paidValue: number;

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

	@computed({
		serializeAs: "additionalInformation",
	})
	public get additional_information() {
		return this.additionalInformation ?? null;
	}

	@column({
		columnName: "cancelled_at",
	})
	public cancelledAt: DateTime | null;

	@column({
		columnName: "cancellation_observation",
	})
	public cancellationObservation: string;

	@column()
	public status: BillStatus;

	@column({
		columnName: "documents_status",
	})
	public documentStatus: TBillDocumentStatus;

	@column()
	public pending: boolean;

	@column({
		columnName: "internal_code",
		serializeAs: "internalCode",
	})
	public internalCode: string | null;

	@column({})
	public cancelled: "P" | "A" | "N" | "S" | "F" | null;

	@column.dateTime({
		columnName: "cancel_date",
		serializeAs: "cancelDate",
	})
	public cancelDate: DateTime | null;

	@column.dateTime({
		columnName: "finish_cancel_date",
		serializeAs: "finishCancelDate",
	})
	public finishCancelDate: DateTime | null;

	@column({
		columnName: "cancel_reason",
		serializeAs: "cancelReason",
	})
	public cancelReason: string | null;

	@column({
		columnName: "cancel_notes",
		serializeAs: "cancelNotes",
	})
	public cancelNotes: string | null;

	@column({
		columnName: "cancel_value_products",
		serializeAs: "cancelValueProducts",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public cancelValueProducts: Decimal | null;

	@column({
		columnName: "cancel_value_services",
		serializeAs: "cancelValueServices",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public cancelValueServices: Decimal | null;

	@column({
		columnName: "cancel_value_total",
		serializeAs: "cancelValueTotal",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public cancelValueTotal: Decimal | null;

	@column({
		columnName: "original_total_value",
		serializeAs: "originalTotalValue",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public originalTotalValue: Decimal | null;

	@column({
		columnName: "original_products_value",
		serializeAs: "originalProductsValue",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public originalProductsValue: Decimal | null;

	@column({
		columnName: "original_services_value",
		serializeAs: "originalServicesValue",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public originalServicesValue: Decimal | null;

	@column({
		columnName: "original_discount_value",
		serializeAs: "originalDiscountValue",
		consume: (value) => (value ? new Decimal(value) : null),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => (value ? value.toNumber() : 0),
	})
	public originalDiscountValue: Decimal | null;

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

	@column({})
	public origin_bill_id: string;

	@column({
		serializeAs: null,
	})
	public financial_responsible_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "financial_responsible_id",
	})
	public financialResponsible: BelongsTo<typeof Patient>;

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
	public patient_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "patient_id",
	})
	public patient: BelongsTo<typeof Patient>;

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
	public user_who_closed_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_who_closed_id",
	})
	public userWhoClosed: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

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
	public budget_id: string;

	@belongsTo(() => Budget, {
		foreignKey: "budget_id",
	})
	public budget: BelongsTo<typeof Budget>;

	@hasMany(() => BillItem, {
		foreignKey: "bill_id",
	})
	public items: HasMany<typeof BillItem>;

	@hasMany(() => BillPayment, {
		foreignKey: "bill_id",
	})
	public payments: HasMany<typeof BillPayment>;

	@column({
		serializeAs: null,
	})
	public treatment_id: number;

	@hasMany(() => BillDocument, {
		foreignKey: "bill_id",
	})
	public documents: HasMany<typeof BillDocument>;

	@column({
		serializeAs: null,
	})
	public cancel_user_id: string | null;

	@belongsTo(() => User, {
		foreignKey: "cancel_user_id",
	})
	public cancelUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public finish_cancel_user_id: string | null;

	@belongsTo(() => User, {
		foreignKey: "finish_cancel_user_id",
	})
	public finishCancelUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public cancel_reason_id: string | null;

	@belongsTo(() => Reason, {
		foreignKey: "cancel_reason_id",
		serializeAs: "_cancelReason",
	})
	public _cancelReason: BelongsTo<typeof Reason>;
}
