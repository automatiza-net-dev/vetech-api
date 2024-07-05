import { DateTime } from "luxon";
import {
	BaseModel,
	beforeFetch,
	beforeFind,
	BelongsTo,
	belongsTo,
	column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import User from "App/Models/User";
import DocumentTemplate from "App/Models/DocumentTemplate";
import Bill from "App/Models/Bill";

export default class BillDocument extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "timeline_ref",
	})
	public timelineRef: string;

	@column({})
	public active: true;

	@column.dateTime({ columnName: "printed_at" })
	public printedAt: DateTime;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({
		serializeAs: null,
	})
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
	public bill_id: string;

	@belongsTo(() => Bill, {
		foreignKey: "bill_id",
	})
	public bill: BelongsTo<typeof Bill>;

	@column({
		serializeAs: null,
	})
	public document_template_id: string;

	@belongsTo(() => DocumentTemplate, {
		foreignKey: "document_template_id",
	})
	public documentTemplate: BelongsTo<typeof DocumentTemplate>;

	@column({
		serializeAs: null,
	})
	public generation_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "generation_user_id",
	})
	public generationUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public print_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "print_user_id",
	})
	public printUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "exclusion_user_id",
	})
	public exclusionUser: BelongsTo<typeof User>;
}
