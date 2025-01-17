import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class ReceiptXml extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "xml_file",
		serializeAs: "xmlFile",
	})
	public xmlFile: string;

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
	public user_id: string;

	@column({
		serializeAs: null,
	})
	public receipt_id: string;
}
