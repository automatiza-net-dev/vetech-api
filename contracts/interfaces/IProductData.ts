import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import { ProductIcmsOrigin, ProductPurpose } from "App/Models/Product";

interface IPrice {
	maximumStock?: number;
	minimumStock?: number;
	maximumDiscountPercentage?: number;
	maximumDiscountValue?: number;
	price: number;
	costPrice?: number;
	profitMargin?: number;
	commission?: number;
	meta?: number;
	metaType?: BusinessUnitProductMetaType;
	commissionMeta?: number;
}

export interface IProductDataVariation {
	barcode?: string;
	price: IPrice;
	specificPrice?: Array<{
		business: string;
		price: IPrice;
	}>;
	variation_options?: Array<string>;
}

export default interface IProductData {
	description: string;
	referenceCode?: string;
	collectionYear?: number;
	subgroupId: string;
	purpose: ProductPurpose;

	features?: string;

	taxationGroupId: string;
	icmsOrigin: (typeof ProductIcmsOrigin)[number];
	ncm?: string;
	cest?: string;
	unitId?: string;

	brandId?: string;

	variationGroup?: string;
	variations: Array<IProductDataVariation>;

	taxBenefitCode?: string;
	anvisaCode?: string;
	active: boolean;
	groupId?: string;
	fractioned?: boolean;
	fractionUnitId?: string;
	fractionValue?: number;
}
