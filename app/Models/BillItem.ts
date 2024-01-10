import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import Bill from "App/Models/Bill";
import TaxationGroupRule from "App/Models/TaxationGroupRule";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import ProductVariation from "./ProductVariation";

export enum BillItemStatus {
	A = "ATIVA",
	I = "INATIVA",
}

export default class BillItem extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public quantity: number;

	@column({
		columnName: "cost_value",
	})
	public costValue: number;

	@column({
		columnName: "sale_value",
	})
	public saleValue: number;

	@column({
		columnName: "unitary_value",
	})
	public unitaryValue: number;

	@column({
		columnName: "discount_value",
	})
	public discountValue: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

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
	})
	public icmsDeferredOperationValue: number;

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
	})
	public icmsBase: number;

	@column({
		columnName: "icms_percentage",
		// serialize: SharedService.ParseDecimal,
		serialize: parseFloat,
	})
	public icmsPercentage: number;

	@column({
		columnName: "icms_value",
	})
	public icmsValue: number;

	@column({
		columnName: "icms_percentage_red_aliquot",
		// serialize: SharedService.ParseDecimal,
		serialize: parseFloat,
	})
	public icmsPercentageRedAliquot: number;

	@column({
		columnName: "icms_percentage_red_base",
		// serialize: SharedService.ParseDecimal,
		serialize: parseFloat,
	})
	public icmsPercentageRedBase: number;

	@column({
		columnName: "icms_deferred_value",
	})
	public icmsDeferredValue: number;

	@column({
		columnName: "icms_partition_value",
	})
	public icmsPartitionValue: number;

	@column({
		columnName: "icms_fcp_percentage",
	})
	public icmsFcpPercentage: number;

	@column({
		columnName: "icms_fcp_value",
	})
	public icmsFcpValue: number;

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
	})
	public icmsPartitionOriginUfValue: number;

	@column({
		columnName: "icms_partition_destination_uf_value",
	})
	public icmsPartitionDestinationUfValue: number;

	@column({
		columnName: "icms_st_base",
	})
	public icmsStBase: number;

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
	})
	public icmsStValue: number;

	@column({
		columnName: "iss_cst",
	})
	public issCst: string;

	@column({
		columnName: "iss_base",
	})
	public issBase: number;

	@column({
		columnName: "iss_percentage",
		// serialize: SharedService.ParseDecimal,
	})
	public issPercentage: number;

	@column({
		columnName: "iss_value",
	})
	public issValue: number;

	@column({
		columnName: "pis_cst",
	})
	public pisCst: string;

	@column({
		columnName: "pis_base",
	})
	public pisBase: number;

	@column({
		columnName: "pis_percentage",
	})
	public pisPercentage: number;

	@column({
		columnName: "pis_value",
	})
	public pisValue: number;

	@column({
		columnName: "pis_retention_value",
	})
	public pisRetentionValue: number;

	@column({
		columnName: "cofins_cst",
	})
	public cofinsCst: string;

	@column({
		columnName: "cofins_base",
	})
	public cofinsBase: number;

	@column({
		columnName: "cofins_percentage",
	})
	public cofinsPercentage: number;

	@column({
		columnName: "cofins_value",
	})
	public cofinsValue: number;

	@column({
		columnName: "cofins_retention_value",
	})
	public cofinsRetentionValue: number;

	@column({
		columnName: "ipi_cst",
	})
	public ipiCst: string;

	@column({
		columnName: "ipi_base",
	})
	public ipiBase: number;

	@column({
		columnName: "ipi_percentage",
	})
	public ipiPercentage: number;

	@column({
		columnName: "ipi_value",
	})
	public ipiValue: number;

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
		columnName: "disabled_at",
	})
	public disabledAt: DateTime;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deleted_at: DateTime;

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
	public exclusion_user_id: string;

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
}
