import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import Budget from "App/Models/Budget";
import ProductVariation from "App/Models/ProductVariation";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export default class BudgetItem extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column({
		consume: (value) => new Decimal(value),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
		columnName: "sale_value",
	})
	public saleValue: Decimal;

	@column({
		consume: (value) => new Decimal(value),
		prepare: (value) => value.toString(),
		serialize: (value: Decimal) => value.toNumber(),
	})
	public quantity: Decimal;

	@column({
		columnName: "unitary_value",
	})
	public unitaryValue: number;

	@column({
		columnName: "discount_value",
	})
	public discountValue: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column()
	public status: string;

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

	public async softDelete(column?: string) {
		await softDelete(this, column);
	}

	@column({
		serializeAs: null,
	})
	public economic_group_id: string;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@column({
		serializeAs: null,
	})
	public budget_id: string;

	@belongsTo(() => Budget, {
		foreignKey: "budget_id",
	})
	public budget: BelongsTo<typeof Budget>;

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
	public kit_id: number;
}
