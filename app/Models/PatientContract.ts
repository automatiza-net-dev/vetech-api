import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";

export default class PatientContract extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		consume: (value) => new Decimal(value),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
	})
	public quantity: Decimal;

	@column({
		columnName: "unitary_value",
		serializeAs: "unitaryValue",
	})
	public unitaryValue: number;

	@column({
		columnName: "promotional_value",
		serializeAs: "promotionalValue",
	})
	public promotionalValue: number;

	@column.dateTime({
		columnName: "promotional_value_expiration",
		serializeAs: "promotionalValueExpiration",
	})
	public promotionalValueExpiration: DateTime;

	@column({
		columnName: "expiration_day",
		serializeAs: "expirationDay",
	})
	public expirationDay: number;

	@column({})
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({})
	public deletedAt: DateTime;

	@beforeFind()
	public static softDeletesFind = softDeleteQuery;

	@beforeFetch()
	public static softDeletesFetch = softDeleteQuery;

	@column({ serializeAs: null })
	public economic_group_id: string;

	@column({ serializeAs: null })
	public business_unit_id: string;

	@column({ serializeAs: null })
	public patient_id: string;

	@column({ serializeAs: null })
	public product_id: string;

	@column({ serializeAs: null })
	public product_variation_id: string;

	@column({ serializeAs: null })
	public business_unit_product_id: string;

	@column({ serializeAs: null })
	public payment_method_id: string;

	@column({ serializeAs: null })
	public user_creation_id: string;

	@column({ serializeAs: null })
	public user_exclusion_id: string;
}
