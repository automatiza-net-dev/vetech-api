import { DateTime } from "luxon";
import { BaseModel, column, HasMany, hasMany } from "@ioc:Adonis/Lucid/Orm";
import ProductivityItemProduct from "App/Models/ProductivityItemProduct";

export const ProductivityItemTypeQty = ["unitario", "total"] as const;
export type TProductivityItemTypeQty = (typeof ProductivityItemTypeQty)[number];

export default class ProductivityItem extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column({
		columnName: "reserved_minutes",
	})
	public reservedMinutes: number;

	@column({
		columnName: "type_qty",
	})
	public typeQty: TProductivityItemTypeQty;

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
	public economic_group_id: string;

	@hasMany(() => ProductivityItemProduct, {
		foreignKey: "productivity_item_id",
	})
	public products: HasMany<typeof ProductivityItemProduct>;
}
