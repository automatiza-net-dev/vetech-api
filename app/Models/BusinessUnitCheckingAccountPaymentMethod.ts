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
import PaymentMethod from "./PaymentMethod";
import CheckingAccount from "./CheckingAccount";
import BusinessUnit from "./BusinessUnit";

export default class BusinessUnitCheckingAccountPaymentMethod extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public active: boolean;

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

	@column({ serializeAs: null })
	public payment_method_id: string;

	@belongsTo(() => PaymentMethod, {
		foreignKey: "payment_method_id",
	})
	public paymentMethod: BelongsTo<typeof PaymentMethod>;

	@column({ serializeAs: null })
	public checking_account_id: string;

	@belongsTo(() => CheckingAccount, {
		foreignKey: "checking_account_id",
	})
	public checkingAccount: BelongsTo<typeof CheckingAccount>;

	@column({ serializeAs: null })
	public business_unit_id: string;

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
	})
	public businessUnit: BelongsTo<typeof BusinessUnit>;
}
