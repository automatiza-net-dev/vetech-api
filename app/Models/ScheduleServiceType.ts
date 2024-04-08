import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import EconomicGroup from "App/Models/EconomicGroup";
import Product from "App/Models/Product";
import Schedule from "App/Models/Schedule";
import ScheduleServiceGroup from "App/Models/ScheduleServiceGroup";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export default class ScheduleServiceType extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column({
		columnName: "reserved_minutes",
	})
	public reservedMinutes: number;

	@column()
	public description: string;

	@column()
	public type: string;

	@column()
	public resume: string;

	@column({
		columnName: "allow_return",
	})
	public allowReturn: boolean;

	@column()
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

	public async softDelete(column?: string) {
		await softDelete(this, column);
	}

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@column()
	public economic_group_id?: string;

	@belongsTo(() => EconomicGroup, {})
	public group: BelongsTo<typeof EconomicGroup>;

	@column()
	public schedule_service_group_id: string;

	@belongsTo(() => ScheduleServiceGroup, {
		localKey: "id",
		foreignKey: "schedule_service_group_id",
	})
	public serviceGroup: BelongsTo<typeof ScheduleServiceGroup>;

	@hasMany(() => Schedule, {
		localKey: "id",
		foreignKey: "schedule_service_type_id",
	})
	public schedules: HasMany<typeof Schedule>;

	@column()
	public product_id: string;

	@belongsTo(() => Product, {
		localKey: "id",
		foreignKey: "product_id",
	})
	public product: BelongsTo<typeof Product>;
}
