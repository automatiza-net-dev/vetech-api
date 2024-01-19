import {
	BaseModel,
	BelongsTo,
	ManyToMany,
	beforeFetch,
	beforeFind,
	belongsTo,
	column,
	manyToMany,
} from "@ioc:Adonis/Lucid/Orm";
import Role from "App/Models/Role";
import Screen from "App/Models/Screen";
import System from "App/Models/System";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";

export const PermissionType = [
	"system",
	"controller",
	"user",
	"both",
	"all",
] as const;
export type TPermissionType = (typeof PermissionType)[number];

export default class Permission extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public description: string;

	@column()
	public control: string;

	@column()
	public control_id: string;

	@column()
	public type: TPermissionType;

	@column({
		columnName: "systems",
		prepare(value) {
			return value.join(",");
		},
		consume(value) {
			if (!value) return [];

			return value.split(",").map((item) => parseFloat(item));
		},
		serializeAs: null,
	})
	public $systems: Array<number>;

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
	public screen_id: number;

	@belongsTo(() => Screen, {
		foreignKey: "screen_id",
	})
	public screen: BelongsTo<typeof Screen>;

	@manyToMany(() => System, {
		pivotTable: "systems_permissions",
		pivotTimestamps: true,
	})
	public systems: ManyToMany<typeof System>;

	@manyToMany(() => Role, {
		pivotTable: "role_permissions",
		pivotTimestamps: true,
		pivotColumns: ["active", "status"],
	})
	public roles: ManyToMany<typeof Role>;
}
