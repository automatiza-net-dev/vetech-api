import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { v4 } from "uuid";

export default class SupplierProduct extends BaseModel {
	@column({ isPrimary: true })
	public id = v4();

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
	public produt_variation_id: string;

	@column({
		serializeAs: null,
	})
	public product_supplier_id: string;
}
