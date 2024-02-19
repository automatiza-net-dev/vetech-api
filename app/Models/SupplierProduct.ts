import { DateTime } from "luxon";
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import ProductVariation from "./ProductVariation";

export default class SupplierProduct extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@column({
		serializeAs: null,
	})
	public supplier_id: string;

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
	public product_supplier_id: string;
}
