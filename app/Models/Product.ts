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
import Brand from "App/Models/Brand";
import EconomicGroup from "App/Models/EconomicGroup";
import Group from "App/Models/Group";
import ProductVariation from "App/Models/ProductVariation";
import Subgroup from "App/Models/Subgroup";
import TaxationGroup from "App/Models/TaxationGroup";
import Unit from "App/Models/Unit";
import VariationGroup from "App/Models/VariationGroup";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export enum ProductType {
	SERVICE = "service",
	PRODUCT = "product",
}

export enum ProductPurpose {
	SALE = "sale",
	INTERNAL = "internal",
	BOTH = "both",
}

export const ProductIcmsOrigin = [
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
] as const;

export const PServiceType = ["service", "exam"] as const;

export default class Product extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public description: string;

	@column()
	public type: ProductType;

	@column()
	public purpose: ProductPurpose;

	@column({
		columnName: "reference_code",
	})
	public referenceCode: string;

	@column({
		columnName: "service_type",
	})
	public serviceType: (typeof PServiceType)[number] | null;

	@column({
		columnName: "collection_year",
	})
	public collectionYear: number;

	@column()
	public ncm?: string;

	@column()
	public cest?: string;

	@column()
	public features: string;

	@column({
		columnName: "icms_origin",
	})
	public icmsOrigin: (typeof ProductIcmsOrigin)[number];

	@column({
		columnName: "service_code",
	})
	public serviceCode: string | null;

	@column({
		columnName: "tax_benefit_code",
	})
	public taxBenefitCode: string | null;

	@column({
		columnName: "anvisa_code",
	})
	public anvisaCode: string | null;

	@column({
		columnName: "fraction_value",
		consume: (value) => new Decimal(value),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
	})
	public fractionValue: Decimal | null;

	@column()
	public fractioned: boolean;

	@column()
	public active: boolean;

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
	public exclusion_user_id: string;

	@column()
	public economic_group_id: string;

	@belongsTo(() => EconomicGroup)
	public economicGroup: BelongsTo<typeof EconomicGroup>;

	@column({
		serializeAs: null,
	})
	public system_product_id: string;

	@column()
	public variation_group_id: string;

	@belongsTo(() => VariationGroup, {
		localKey: "id",
		foreignKey: "variation_group_id",
	})
	public variationGroup: BelongsTo<typeof VariationGroup>;

	@hasMany(() => ProductVariation, {
		localKey: "id",
		foreignKey: "product_id",
	})
	public variations: HasMany<typeof ProductVariation>;

	@column({
		serializeAs: null,
	})
	public group_id?: string;

	@belongsTo(() => Group, {
		localKey: "id",
		foreignKey: "group_id",
	})
	public group: BelongsTo<typeof Group>;

	@column({
		serializeAs: null,
	})
	public subgroup_id: string;

	@belongsTo(() => Subgroup, {
		localKey: "id",
		foreignKey: "subgroup_id",
	})
	public subgroup: BelongsTo<typeof Subgroup>;

	@column({
		serializeAs: null,
	})
	public fraction_unit_id: string;

	@belongsTo(() => Unit, {
		localKey: "id",
		foreignKey: "fraction_unit_id",
	})
	public fractionUnit: BelongsTo<typeof Unit>;

	@column({
		serializeAs: null,
	})
	public unit_id: string;

	@belongsTo(() => Unit, {
		localKey: "id",
		foreignKey: "unit_id",
	})
	public unit: BelongsTo<typeof Unit>;

	@column({
		serializeAs: null,
	})
	public taxation_group_id: string;

	@belongsTo(() => TaxationGroup, {
		localKey: "id",
		foreignKey: "taxation_group_id",
	})
	public taxationGroup: BelongsTo<typeof TaxationGroup>;

	@column({
		serializeAs: null,
	})
	public brand_id: string;

	@belongsTo(() => Brand, {
		localKey: "id",
		foreignKey: "brand_id",
	})
	public brand: BelongsTo<typeof Brand>;
}
