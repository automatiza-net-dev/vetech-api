import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export const BorderoType = ["Debito", "Credito"] as const;
export type TBorderoType = typeof BorderoType[number];

export const BorderoStatus = ["Aberto", "Fechado"] as const;
export type TBorderoStatus = typeof BorderoStatus[number];

export default class Bordero extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public type: TBorderoType;

	@column()
	public document: string;

	@column()
	public description: string;

	@column()
	public history: string;

	@column.dateTime({
		columnName: "issue_date",
	})
	public issueDate: DateTime;

	@column.dateTime({
		columnName: "bordero_date",
	})
	public borderoDate: DateTime;

	@column.dateTime({
		columnName: "payment_date",
	})
	public paymentDate: DateTime;

	@column({
		columnName: "bordero_value",
	})
	public borderoValue: number;

	@column({
		columnName: "interest_value",
	})
	public interestValue: number;

	@column({
		columnName: "discount_value",
	})
	public discountValue: number;

	@column({
		columnName: "total_value",
	})
	public totalValue: number;

	@column({
		columnName: "payment_value",
	})
	public paymentValue: number;

	@column()
	public observation: string;

	@column({
		columnName: "reason_for_reversal",
	})
	public reasonForReversal: string;

	@column()
	public status: TBorderoStatus;

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
	public daily_movement_id: string;

	@column({
		serializeAs: null,
	})
	public checking_account_id: string;

	@column({
		serializeAs: null,
	})
	public bank_statement_id: string;

	@column({
		serializeAs: null,
	})
	public payment_method_id: string;
}
