import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class OpportunityKanbanLog extends BaseModel {
	@column({ isPrimary: true })
	public id: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column({ serializeAs: null })
	public economic_group_id: string;

	@column({ serializeAs: null })
	public business_unit_id: string;

	@column({ serializeAs: null })
	public opportunity_id: number;

	@column({ serializeAs: null })
	public origin_kanban_id: number;

	@column({ serializeAs: null })
	public destination_kanban_id: number;

	@column({ serializeAs: null })
	public user_id: string;
}
