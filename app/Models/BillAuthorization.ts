import { DateTime } from "luxon";
import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Bill from "App/Models/Bill";
import BillItem from "App/Models/BillItem";
import BillPayment from "App/Models/BillPayment";
import User from "App/Models/User";

export default class BillAuthorization extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public type: "cancel" | "courtesy" | "maxDiscount" | "maxParcelas";

	@column({
		columnName: "authorization_type",
		serializeAs: "authorizationType",
	})
	public authorizationType: "P" | "RC" | "AC";

	@column()
	public approved: boolean;

	@column({
		columnName: "cancelled_quantity",
		serializeAs: "cancelledQuantity",
	})
	public cancelledQuantity: number;

	@column.dateTime({
		columnName: "authorization_date",
		serializeAs: "authorizationDate",
	})
	public authorizationDate: DateTime;

	@column({
		columnName: "authorization_observations",
		serializeAs: "authorizationObservations",
	})
	public authorizationObservations: string;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({ serializeAs: null })
	public bill_id: string;

	@column({ serializeAs: null })
	public bill_item_id: string | null;

	@column({ serializeAs: null })
	public bill_payment_id: string | null;

	@column({ serializeAs: null })
	public authorization_user_id: string;

	@belongsTo(() => Bill, {
		foreignKey: "bill_id",
	})
	public bill: BelongsTo<typeof Bill>;

	@belongsTo(() => BillItem, {
		foreignKey: "bill_item_id",
	})
	public billItem: BelongsTo<typeof BillItem>;

	@belongsTo(() => BillPayment, {
		foreignKey: "bill_payment_id",
	})
	public billPayment: BelongsTo<typeof BillPayment>;

	@belongsTo(() => User, {
		foreignKey: "authorization_user_id",
	})
	public authorizationUser: BelongsTo<typeof User>;
}
