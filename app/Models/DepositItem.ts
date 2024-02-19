import { DateTime } from "luxon";
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Deposit from "./Deposit";
import BusinessUnitProduct from "./BusinessUnitProduct";
import ProductVariation from "./ProductVariation";
import Decimal from "decimal.js";

export const DepositItemStatus = ["Ativo", "Inativo"] as const;
export type TDepositItemStatus = (typeof DepositItemStatus)[number];

export default class DepositItem extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		consume: (value) => new Decimal(value),
		prepare: (value) => value.toString(),
	})
	public quantity: Decimal;

	@column()
	public status: TDepositItemStatus;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public deposit_id: number;

	@column({
		serializeAs: null,
	})
	public business_unit_product_id: string;

	@column({
		serializeAs: null,
	})
	public product_variation_id: string;

	@belongsTo(() => Deposit, {
		foreignKey: "deposit_id",
	})
	public deposit: BelongsTo<typeof Deposit>;

	@belongsTo(() => BusinessUnitProduct, {
		foreignKey: "business_unit_product_id",
	})
	public unitProduct: BelongsTo<typeof BusinessUnitProduct>;

	@belongsTo(() => ProductVariation, {
		foreignKey: "product_variation_id",
	})
	public variation: BelongsTo<typeof ProductVariation>;
}
