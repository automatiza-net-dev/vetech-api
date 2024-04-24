import { DateTime } from "luxon";
import {
	BaseModel,
	column,
	ManyToMany,
	manyToMany,
} from "@ioc:Adonis/Lucid/Orm";
import Variation from "./Variation";

export default class SystemVariationGroup extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

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

	@manyToMany(() => Variation, {
		pivotTable: "system_variation_group_variations",
		pivotTimestamps: false,
		localKey: "id",
		pivotForeignKey: "system_variation_group_id",
		relatedKey: "id",
		pivotRelatedForeignKey: "variation_id",
	})
	// eslint-disable-next-line no-use-before-define
	public variations: ManyToMany<typeof Variation>;
}
