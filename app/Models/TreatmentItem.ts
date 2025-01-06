import {
	BaseModel,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import Kit from "App/Models/Kit";
import ProductVariation from "App/Models/ProductVariation";
import { DateTime } from "luxon";

import TreatmentExecution from "./TreatmentExecution";

export const TreatmentItemStatus = ["Ativo", "Confirmado", "Excluido"] as const;
export type TreatmentItemStatus = (typeof TreatmentItemStatus)[number];

export default class TreatmentItem extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public quantity: number;

	@column({
		columnName: "scheduled_quantity",
	})
	public scheduledQuantity = 0;

	@column({
		columnName: "quantity_executed",
	})
	public quantityExecuted: number;

	@column()
	public observations: string;

	@column()
	public status: TreatmentItemStatus;

	@column.dateTime({
		columnName: "exclusion_date",
	})
	public exclusionDate: DateTime | null;

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
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@column({
		serializeAs: null,
	})
	public treatment_id: number;

	@column({
		serializeAs: null,
	})
	public kit_id: number;

	@belongsTo(() => Kit, {
		foreignKey: "kit_id",
	})
	public kit: BelongsTo<typeof Kit>;

	@column({
		serializeAs: null,
	})
	public product_variation_id: string;

	@belongsTo(() => ProductVariation, {
		foreignKey: "product_variation_id",
	})
	public productVariation: BelongsTo<typeof ProductVariation>;

	@hasMany(() => TreatmentExecution, {
		foreignKey: "treatment_item_id",
	})
	public executions: HasMany<typeof TreatmentExecution>;

	@column({
		serializeAs: null,
	})
	public reference_item_id: number;

	@column({
		serializeAs: null,
	})
	public productivity_item_id: number;

	@column({
		serializeAs: null,
	})
	public bill_item_id: number;
}
