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
import BudgetItem from "App/Models/BudgetItem";
import DailyMovement from "App/Models/DailyMovement";
import Patient from "App/Models/Patient";
import Reason from "App/Models/Reason";
import User from "App/Models/User";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import BusinessUnit from "App/Models/BusinessUnit";
import Attendance from "./Attendance";

export enum BudgetStatus {
	A = "ABERTO",
	C = "CONFIRMADO",
	N = "NAO_CONFIRMADO__CANCELADO",
	P = "CONFIRMADO_PARCIAL",
}

export default class Budget extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public tag: string;

	@column.dateTime({
		columnName: "budget_date",
	})
	public budgetDate: DateTime;

	@column.date({
		columnName: "expiration_date",
	})
	public expirationDate: DateTime;

	@column({
		columnName: "product_value",
	})
	public productValue: number;

	@column({
		columnName: "service_value",
	})
	public serviceValue: number;

	@column({
		columnName: "discount_value",
	})
	public discountValue: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column({
		columnName: "paid_value",
	})
	public paidValue: number;

	@column()
	public observation: string;

	@column.dateTime({
		columnName: "finished_at",
	})
	public finishedAt: DateTime;

	@column({
		columnName: "canceled_observation",
	})
	public canceledObservation: string;

	@column({
		columnName: "client_name",
	})
	public clientName: string;

	@column({
		columnName: "internal_observation",
	})
	public internalObservation: string;

	@column()
	public status: BudgetStatus;

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
	public attendance_id: number;

	@belongsTo(() => Attendance, {
		foreignKey: "attendance_id",
	})
	public attendance: BelongsTo<typeof Attendance>;

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
	public client_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "client_id",
	})
	public client: BelongsTo<typeof Patient>;

	@column({
		serializeAs: null,
	})
	public patient_id: string;

	@belongsTo(() => Patient, {
		foreignKey: "patient_id",
	})
	public patient: BelongsTo<typeof Patient>;

	@column({
		serializeAs: null,
	})
	public user_id: string;

	@belongsTo(() => User, {
		foreignKey: "user_id",
	})
	public user: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public seller_id: string;

	@belongsTo(() => User, {
		foreignKey: "seller_id",
	})
	public seller: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public reviewer_id: string;

	@belongsTo(() => User, {
		foreignKey: "reviewer_id",
	})
	public reviewer: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public daily_movement_id: string;

	@belongsTo(() => DailyMovement, {
		foreignKey: "daily_movement_id",
	})
	public dailyMovement: BelongsTo<typeof DailyMovement>;

	@column({
		serializeAs: null,
	})
	public bill_id: string;

	@column({
		serializeAs: null,
	})
	public conclusion_user_id: string;

	@belongsTo(() => User, {
		foreignKey: "conclusion_user_id",
	})
	public conclusionUser: BelongsTo<typeof User>;

	@column({
		serializeAs: null,
	})
	public cancelation_reason_id: string;

	@belongsTo(() => Reason, {
		foreignKey: "cancelation_reason_id",
	})
	public cancelationReason: BelongsTo<typeof Reason>;

	@hasMany(() => BudgetItem, {
		foreignKey: "budget_id",
	})
	public items: HasMany<typeof BudgetItem>;
}
