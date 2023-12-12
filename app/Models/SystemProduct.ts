import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import {
	PServiceType,
	ProductIcmsOrigin,
	ProductPurpose,
	ProductType,
} from "App/Models/Product";
import { DateTime } from "luxon";

export default class SystemProduct extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

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
	public serviceType: typeof PServiceType[number] | null;

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
	public icmsOrigin: typeof ProductIcmsOrigin[number];

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

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@column({
		serializeAs: null,
	})
	public system_variation_group_id: number;

	@column({
		serializeAs: null,
	})
	public system_taxation_group_id: number;

	// @column({
	//   serializeAs: null,
	// })
	// public variation_group_id: string;
	//
	// @column({
	//   serializeAs: null,
	// })
	// public group_id?: string;
	//
	// @column({
	//   serializeAs: null,
	// })
	// public subgroup_id: string;
	//
	// @column({
	//   serializeAs: null,
	// })
	// public unit_id: string;
	//
	// @column({
	//   serializeAs: null,
	// })
	// public taxation_group_id: string;
	//
	// @column({
	//   serializeAs: null,
	// })
	// public brand_id: string;
}
