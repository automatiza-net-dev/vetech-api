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
import BusinessUnit from "App/Models/BusinessUnit";
import { BusinessUnitFiscalDocumentMovementType } from "App/Models/BusinessUnitFiscalDocument";
import CorrectedFiscalDocument from "App/Models/CorrectedFiscalDocument";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import Bill from "./Bill";
import Receipt from "./Receipt";
import User from "./User";

export enum IssuedFiscalDocumentContingency {
	N = "NÃO",
}

export default class IssuedFiscalDocument extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column({
		columnName: "movement_type",
	})
	public movementType: BusinessUnitFiscalDocumentMovementType;

	@column()
	model: string;

	@column()
	series: string;

	@column()
	sequence: string;

	@column()
	purpose: string;

	@column()
	finality: 1 | 2 | 3 | 4;

	@column({
		columnName: "access_key",
	})
	accessKey: string;

	@column({
		columnName: "access_key_ref",
	})
	accessKeyRef: string;

	@column.dateTime({
		columnName: "authorization_date",
	})
	public authorizationDate: DateTime;

	@column({
		columnName: "authorization_receipt",
	})
	authorizationReceipt: string;

	@column.dateTime({
		columnName: "authorization_receipt_date",
	})
	public authorizationReceiptDate: DateTime;

	// cancellation
	@column.dateTime({
		columnName: "cancellation_date",
	})
	public cancellationDate: DateTime;

	@column({
		columnName: "cancellation_receipt",
	})
	cancellationReceipt: string;

	@column.dateTime({
		columnName: "cancellation_receipt_date",
	})
	public cancellationReceiptDate: DateTime;

	@column({
		columnName: "cancellation_reason",
	})
	cancellationReason: string;

	// disabling
	@column.dateTime({
		columnName: "disabling_date",
	})
	public disablingDate: DateTime;

	@column({
		columnName: "disabling_receipt",
	})
	disablingReceipt: string;

	@column.dateTime({
		columnName: "disabling_receipt_date",
	})
	public disablingReceiptDate: DateTime;

	@column({
		columnName: "disabling_reason",
	})
	disablingReason: string;
	//

	@column()
	contingency: IssuedFiscalDocumentContingency;

	@column.dateTime({
		columnName: "contingency_date",
	})
	public contingencyDate: DateTime;

	@column({
		columnName: "contingency_reason",
	})
	public contingencyReason: string;

	@column.dateTime({
		columnName: "contingency_delivery_date",
	})
	public contingencyDeliveryDate: DateTime;

	// sefaz
	@column({
		columnName: "sefaz_status_code",
	})
	sefazStatusCode: string;

	@column({
		columnName: "sefaz_status",
	})
	sefazStatus: string;

	@column({
		columnName: "sefaz_message",
	})
	sefazMessage: string;

	@column({
		columnName: "authorization_xml_path",
	})
	authorizationXmlPath: string;

	@column({
		columnName: "authorization_pdf_path",
	})
	authorizationPdfPath: string;

	@column({
		columnName: "cancellation_xml_path",
	})
	cancellationXmlPath: string;

	@column({
		columnName: "disabling_xml_path",
	})
	disablingXmlPath: string;

	//
	@column()
	active: boolean;

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

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
	})
	public unit: BelongsTo<typeof BusinessUnit>;

	@column({
		serializeAs: null,
	})
	public user_who_authorized_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_who_authorized_id",
	})
	public authorizationUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public user_who_cancelled_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_who_cancelled_id",
	})
	public cancellationUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public user_who_disabled_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_who_disabled_id",
	})
	public disablingUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public user_who_did_contingency_id: string;

	@column({
		serializeAs: null,
	})
	public bill_id: string;

	@belongsTo(() => Bill, {
		foreignKey: "bill_id",
	})
	public bill: BelongsTo<typeof Bill>;

	@belongsTo(() => Receipt, {
		foreignKey: "bill_id",
	})
	public receipt: BelongsTo<typeof Receipt>;

	@column({
		serializeAs: null,
	})
	public fiscal_document_id: string;

	@hasMany(() => CorrectedFiscalDocument, {
		foreignKey: "fiscal_document_id",
	})
	public corrections: HasMany<typeof CorrectedFiscalDocument>;
}
