import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";
import Product from "./Product";
import PaymentMethod from "./PaymentMethod";
import TefFlag from "./TefFlag";
import TefAcquirer from "./TefAcquirer";

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

	@column({
		columnName: "promotional_value_expiration",
		serializeAs: "promotionalValueExpiration",
	})
	public promotionalValueExpiration: string;

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

	@column.dateTime({ serializeAs: null })
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

	@belongsTo(() => Product, {
		foreignKey: "product_id",
	})
	public product: BelongsTo<typeof Product>;

	@column({ serializeAs: null })
	public product_variation_id: string;

	@column({ serializeAs: null })
	public business_unit_product_id: string;

	@column({ serializeAs: null })
	public payment_method_id: string;

	@belongsTo(() => PaymentMethod, {
		foreignKey: "payment_method_id",
	})
	public paymentMethod: BelongsTo<typeof PaymentMethod>;

	@column({ serializeAs: null })
	public user_creation_id: string;

	@column({ serializeAs: null })
	public user_updated_id: string | null;

	@column({ serializeAs: null })
	public user_exclusion_id: string | null;

	@column({ serializeAs: null })
	public payment_method_tef_flag_id: string | null;

	@belongsTo(() => TefFlag, {
		foreignKey: "payment_method_tef_flag_id",
	})
	public tefFlag: BelongsTo<typeof TefFlag>;

	@column({ serializeAs: null })
	public payment_method_tef_acquirer_id: string | null;

	@belongsTo(() => TefAcquirer, {
		foreignKey: "payment_method_tef_acquirer_id",
	})
	public tefAcquirer: BelongsTo<typeof TefAcquirer>;
}
