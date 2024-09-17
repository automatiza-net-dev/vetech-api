import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import Specie from "App/Models/Specie";
import Vaccine from "App/Models/Vaccine";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export default class VaccineProtocol extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public name: string;

	@column()
	public doses: number;

	@column()
	public interval: number;

	@column({
		columnName: "expiration_days",
		serializeAs: "expirationDays",
	})
	public expirationDays: number | null;

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

	@column()
	public vaccine_id: string;

	@belongsTo(() => Vaccine, {
		foreignKey: "vaccine_id",
	})
	public vaccine: BelongsTo<typeof Vaccine>;

	@column()
	public specie_id?: string;

	@belongsTo(() => Specie, {
		foreignKey: "specie_id",
	})
	public specie: BelongsTo<typeof Specie>;
}
