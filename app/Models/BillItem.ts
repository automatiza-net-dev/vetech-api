import Bill from "App/Models/Bill";
import TaxationGroupRule from "App/Models/TaxationGroupRule";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { BaseModel, BelongsTo, beforeFind, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import ProductVariation from "./ProductVariation";
import User from "./User";

// Helper functions for Decimal column configuration
const decimalConsume = (value: any): Decimal | null => {
  return value ? new Decimal(value) : null;
};

const decimalPrepare = (value: any): string | null => {
  if (!value) return null;
  const decimal = value instanceof Decimal ? value : new Decimal(value);
  return decimal.toFixed(2);
};

const decimalSerialize = (value: Decimal | null): number | null => {
  return value ? value.toNumber() : null;
};

export enum BillItemStatus {
  A = "ATIVA",
  I = "INATIVA",
}

export default class BillItem extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    consume: (value) => new Decimal(value),
    prepare: (value) => value.toString(),
    serialize: (value: Decimal) => value.toNumber(),
  })
  public quantity: Decimal;

  @column({
    columnName: "cost_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public costValue: Decimal | null;

  @column({
    columnName: "sale_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public saleValue: Decimal | null;

  @column({
    columnName: "unitary_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public unitaryValue: Decimal | null;

  @column({
    columnName: "discount_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public discountValue: Decimal | null;

  @column({
    columnName: "total_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public totalValue: Decimal | null;

  @column({
    columnName: "fiscal_operation_code",
  })
  public fiscalOperationCode: string;

  @column({
    columnName: "fiscal_benefit_code",
  })
  public fiscalBenefitCode: string;

  @column({
    columnName: "icms_origin_product",
  })
  public icmsOriginProduct: string;

  @column({
    columnName: "icms_deferred_operation_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsDeferredOperationValue: Decimal | null;

  @column({
    columnName: "icms_deferred_percentage",
  })
  public icmsDeferredPercentage: number;

  @column({
    columnName: "icms_cst",
  })
  public icmsCst: string;

  @column({
    columnName: "icms_base",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsBase: Decimal | null;

  @column({
    columnName: "icms_percentage",
    // serialize: SharedService.ParseDecimal,
    serialize: Number.parseFloat,
  })
  public icmsPercentage: number;

  @column({
    columnName: "icms_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsValue: Decimal | null;

  @column({
    columnName: "icms_percentage_red_aliquot",
    // serialize: SharedService.ParseDecimal,
    serialize: Number.parseFloat,
  })
  public icmsPercentageRedAliquot: number;

  @column({
    columnName: "icms_percentage_red_base",
    // serialize: SharedService.ParseDecimal,
    serialize: Number.parseFloat,
  })
  public icmsPercentageRedBase: number;

  @column({
    columnName: "icms_deferred_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsDeferredValue: Decimal | null;

  @column({
    columnName: "icms_partition_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsPartitionValue: Decimal | null;

  @column({
    columnName: "icms_fcp_percentage",
  })
  public icmsFcpPercentage: number;

  @column({
    columnName: "icms_fcp_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsFcpValue: Decimal | null;

  @column({
    columnName: "icms_partition_origin_uf_percentage",
  })
  public icmsPartitionOriginUfPercentage: number;

  @column({
    columnName: "icms_partition_destination_uf_percentage",
  })
  public icmsPartitionDestinationUfPercentage: number;

  @column({
    columnName: "icms_partition_inter_uf_percentage",
  })
  public icmsPartitionInterUfPercentage: number;

  @column({
    columnName: "icms_partition_origin_uf_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsPartitionOriginUfValue: Decimal | null;

  @column({
    columnName: "icms_partition_destination_uf_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsPartitionDestinationUfValue: Decimal | null;

  @column({
    columnName: "icms_st_base",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsStBase: Decimal | null;

  @column({
    columnName: "icms_st_percentage_red_base",
  })
  public icmsStPercentageRedBase: number;

  @column({
    columnName: "icms_st_iva",
  })
  public icmsStIva: number;

  @column({
    columnName: "icms_st_percentage_uf_destination",
  })
  public icmsStPercentageUfDestination: number;

  @column({
    columnName: "icms_st_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public icmsStValue: Decimal | null;

  @column({
    columnName: "iss_cst",
  })
  public issCst: string;

  @column({
    columnName: "iss_base",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public issBase: Decimal | null;

  @column({
    columnName: "iss_percentage",
    // serialize: SharedService.ParseDecimal,
  })
  public issPercentage: number;

  @column({
    columnName: "iss_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public issValue: Decimal | null;

  @column({
    columnName: "pis_cst",
  })
  public pisCst: string;

  @column({
    columnName: "pis_base",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public pisBase: Decimal | null;

  @column({
    columnName: "pis_percentage",
  })
  public pisPercentage: number;

  @column({
    columnName: "pis_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public pisValue: Decimal | null;

  @column({
    columnName: "pis_retention_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public pisRetentionValue: Decimal | null;

  @column({
    columnName: "cofins_cst",
  })
  public cofinsCst: string;

  @column({
    columnName: "cofins_base",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public cofinsBase: Decimal | null;

  @column({
    columnName: "cofins_percentage",
  })
  public cofinsPercentage: number;

  @column({
    columnName: "cofins_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public cofinsValue: Decimal | null;

  @column({
    columnName: "cofins_retention_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public cofinsRetentionValue: Decimal | null;

  @column({
    columnName: "ipi_cst",
  })
  public ipiCst: string;

  @column({
    columnName: "ipi_base",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public ipiBase: Decimal | null;

  @column({
    columnName: "ipi_percentage",
  })
  public ipiPercentage: number;

  @column({
    columnName: "ipi_value",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public ipiValue: Decimal | null;

  @column({
    columnName: "ibpt_city_percentage",
  })
  public ibptCityPercentage: number;

  @column({
    columnName: "ibpt_state_percentage",
  })
  public ibptStatePercentage: number;

  @column({
    columnName: "ibpt_country_percentage",
  })
  public ibptCountryPercentage: number;

  @column({
    columnName: "nfe_issued",
  })
  public nfeIssued: boolean;

  @column({
    columnName: "status",
  })
  public status: BillItemStatus;

  @column.dateTime({
    columnName: "data_document",
  })
  public dataDocument: DateTime;

  @column({})
  public courtesy: boolean;

  @column.dateTime({
    columnName: "courtesy_approved_at",
  })
  public courtesyApprovedAt: DateTime | null;

  @column({ columnName: "max_discount" })
  public maxDiscount: boolean;

  @column({
    columnName: "pending_observations",
  })
  public pendingObservations: string | null;

  @column({})
  public approved: boolean;

  @column.dateTime({
    columnName: "disabled_at",
  })
  public disabledAt: DateTime;

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

  @column({
    columnName: "cancelled_quantity",
    serializeAs: "cancelledQuantity",
  })
  public cancelledQuantity: number | null;

  @column({
    columnName: "original_total_value",
    serializeAs: "originalTotalValue",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public originalTotalValue: Decimal | null;

  @column({
    columnName: "original_quantity",
    serializeAs: "originalQuantity",
    consume: decimalConsume,
    prepare: decimalPrepare,
    serialize: decimalSerialize,
  })
  public originalQuantity: Decimal | null;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deleted_at: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  // @beforeFetch()
  // public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

  @column({
    serializeAs: null,
  })
  public exclusion_user_id: string;

  @column({
    serializeAs: null,
  })
  public courtesy_issued_user_id: string | null;

  @belongsTo(() => User, {
    foreignKey: "courtesy_issued_user_id",
  })
  public courtesyIssuedUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public courtesy_approved_user_id: string | null;

  @belongsTo(() => User, {
    foreignKey: "courtesy_approved_user_id",
  })
  public courtesyApprovedUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public deposit_id: number;

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
  public bill_id: string;

  @belongsTo(() => Bill, {
    foreignKey: "bill_id",
  })
  public bill: BelongsTo<typeof Bill>;

  @column({
    serializeAs: null,
  })
  public product_variation_id: string;

  @belongsTo(() => ProductVariation, {
    foreignKey: "product_variation_id",
  })
  public productVariation: BelongsTo<typeof ProductVariation>;

  @column({
    serializeAs: null,
  })
  public tax_rule_id: string;

  @belongsTo(() => TaxationGroupRule, {
    foreignKey: "tax_rule_id",
  })
  public taxRule: BelongsTo<typeof TaxationGroupRule>;

  @column({
    serializeAs: null,
  })
  public kit_id: number;

  @column({
    serializeAs: null,
  })
  public reviewer_cancel_user_id: string | null;

  @belongsTo(() => User, {
    foreignKey: "reviewer_cancel_user_id",
    serializeAs: "reviewerCancelUser",
  })
  public reviewerCancelUser: BelongsTo<typeof User>;
}
