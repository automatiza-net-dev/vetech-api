import { DateTime } from "luxon";
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import BusinessUnitProduct from "./BusinessUnitProduct";
import ProductVariation from "./ProductVariation";

export const DepositMovementItemStatus = ["Ativo", "Inativo"] as const;
export type TDepositMovementItemStatus =
	typeof DepositMovementItemStatus[number];

export default class DepositMovementItem extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public quantity: number;

	@column()
	public status: TDepositMovementItemStatus;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public deposit_movement_id: number;

	@column({
		serializeAs: null,
	})
	public business_unit_product_id: string;

	@column({
		serializeAs: null,
	})
	public product_variation_id: string;

	@belongsTo(() => BusinessUnitProduct, {
		foreignKey: "business_unit_product_id",
	})
	public unitProduct: BelongsTo<typeof BusinessUnitProduct>;

	@belongsTo(() => ProductVariation, {
		foreignKey: "product_variation_id",
	})
	public variation: BelongsTo<typeof ProductVariation>;
}
