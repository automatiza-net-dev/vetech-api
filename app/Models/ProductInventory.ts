import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class ProductInventory extends BaseModel {
	@column({ isPrimary: true })
	public id: string;

	@column({})
	public date: string;

	@column({})
	public stock: string;

	@column({
		columnName: "cost_price",
		serializeAs: "costPrice",
	})
	public costPrice: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column({ serializeAs: null })
	public economic_group_id: string;

	@column({ serializeAs: null })
	public business_unit_id: string;

	@column({ serializeAs: null })
	public product_id: string;

	@column({ serializeAs: null })
	public product_variation_id: string;

	@column({ serializeAs: null })
	public business_unit_product_id: string;
}
