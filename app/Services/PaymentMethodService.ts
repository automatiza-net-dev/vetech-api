import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnit from "App/Models/BusinessUnit";
import BusinessUnitCheckingAccountPaymentMethod from "App/Models/BusinessUnitCheckingAccountPaymentMethod";
import PaymentMethod from "App/Models/PaymentMethod";
import PaymentMethodFee from "App/Models/PaymentMethodFee";
import PaymentMethodFlag from "App/Models/PaymentMethodFlag";
import PaymentMethodFlagInstallment from "App/Models/PaymentMethodFlagInstallment";
import TefAcquirer from "App/Models/TefAcquirer";
import TefFlag from "App/Models/TefFlag";
import SharedService, { AuthContext } from "App/Services/SharedService";
import {
	ICreatePaymentMethodData,
	ICreatePaymentMethodFeeData,
	ICreatePaymentMethodFlagData,
	IUpdatePaymentMethodFlagData,
} from "Contracts/interfaces/IPaymentMethodData";

interface ISearchPaymentMethods {
	description?: string;
	tef?: string;
	type?: string;
}

interface ISearchCompletePaymentMethods extends ISearchPaymentMethods {
	active?: string;
	cancellation?: string;
	account?: string;
}

interface ISearchTefFlags {
	type?: string;
}

@inject()
export default class PaymentMethodService {
	constructor(private sharedService: SharedService) {}

	async searchPartialPaymentMethods(
		unitId: string,
		data: ISearchPaymentMethods,
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		const qb = PaymentMethod.query().where("economic_group_id", group.id);

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.tef) {
			qb.where("tef", data.tef);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		return qb;
	}

	async searchCompletePaymentMethods(
		unitId: string,
		data: ISearchCompletePaymentMethods,
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		const qb = PaymentMethod.query()
			.preload("flags", (query) => {
				query.preload("acquirer", (query) => {
					query.select("id", "description");
				});
				query.preload("flag", (query) => {
					query.select("id", "description", "code", "type");
				});
				query.preload("installments");
			})
			.preload("fees")
			.preload("checkingAccount");

		qb.where("economic_group_id", group.id);

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.tef) {
			qb.where("tef", data.tef);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		if (data.active) {
			qb.where("active", data.active === "true");
		}

		if (data.cancellation) {
			qb.where("automatic_cancellation", data.cancellation === "true");
		}

		if (data.account) {
			qb.whereHas("checkingAccount", (query) => {
				query.where("type", data.account as string);
			});
		}

		return qb;
	}

	async searchTefFlags(unitId: string, data: ISearchTefFlags) {
		if (!data.type) {
			throw new BadRequestException(
				"Informe o tipo de TEF",
				400,
				"E_MISSING_PARAMETER",
			);
		}

		const group = await this.sharedService.getUserGroup(unitId);

		const qb = TefFlag.query();

		qb.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
			group.id,
		]);

		if (data.type === "C") {
			qb.whereIn("type", ["A", "C"]);
		} else {
			qb.whereIn("type", ["A", "B", "D"]);
		}

		return qb;
	}

	async searchTefAcquirers(unitId: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		const qb = TefAcquirer.query();

		qb.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
			group.id,
		]);

		return qb;
	}

	async createPaymentMethod(
		authCtx: AuthContext,
		data: Omit<ICreatePaymentMethodData, "active">,
	) {
		return Database.transaction(async (trx) => {
			const method = await PaymentMethod.create(
				{
					economicGroupId: authCtx.group.id,
					description: data.description,
					requiresDocument: data.requiresDocument,
					tef: data.tef,
					automaticCancellation: data.automaticCancellation,
					daysFirstInstallment: data.daysFirstInstallment,
					daysBetweenInstallments: data.daysBetweenInstallments,
					allowChangeExpirationDate: data.allowChangeExpirationDate,
					minimumInstallmentValue: data.minimumInstallmentValue,
					type: data.type,
					usage: data.usage,
					checkingAccountId: data.checkingAccountId,
					fee: data.fee ?? 0,
					daysUntilTransfer: data.daysUntilTransfer ?? 0,
					installmentsWithoutPassword: data.installmentsWithoutPassword,
					maxInstallments: data.maxInstallments,
					nfe_code: "99",
				},
				{ client: trx },
			);

			if (data.checkingAccountId) {
				await BusinessUnitCheckingAccountPaymentMethod.firstOrCreate(
					{
						business_unit_id: authCtx.unit.id,
						payment_method_id: method.id,
					},
					{
						business_unit_id: authCtx.unit.id,
						payment_method_id: method.id,
						checking_account_id: data.checkingAccountId,
					},
					{ client: trx },
				);
			}

			return method;
		});
	}

	async updatePaymentMethod(
		authCtx: AuthContext,
		id: string,

		data: ICreatePaymentMethodData,
	) {
		return Database.transaction(async (trx) => {
			const paymentMethod = await PaymentMethod.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();
			if (!paymentMethod) {
				throw this.sharedService.ResourceNotFound();
			}

			if (data.checkingAccountId) {
				await BusinessUnitCheckingAccountPaymentMethod.updateOrCreate(
					{
						business_unit_id: authCtx.unit.id,
						payment_method_id: id,
					},
					{
						checking_account_id: data.checkingAccountId,
					},
					{ client: trx },
				);
			}

			return paymentMethod
				.merge({
					description: data.description,
					requiresDocument: data.requiresDocument,
					tef: data.tef,
					automaticCancellation: data.automaticCancellation,
					daysFirstInstallment: data.daysFirstInstallment,
					daysBetweenInstallments: data.daysBetweenInstallments,
					allowChangeExpirationDate: data.allowChangeExpirationDate,
					minimumInstallmentValue: data.minimumInstallmentValue,
					type: data.type,
					usage: data.usage,

					checkingAccountId: data.checkingAccountId,
					fee: data.fee ?? 0,
					daysUntilTransfer: data.daysUntilTransfer ?? 0,
					installmentsWithoutPassword: data.installmentsWithoutPassword,
					maxInstallments: data.maxInstallments,
					active: data.active,
				})
				.save();
		});
	}

	async createPaymentMethodFlag(
		unitId: string,
		data: ICreatePaymentMethodFlagData,
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const existingFlag = await PaymentMethodFlag.query()
				.useTransaction(trx)
				.where("economic_group_id", group.id)
				.where("tef_flag_id", data.tefFlagId)
				.where("tef_acquirer_id", data.tefAcquirerId)
				.where("payment_method_id", data.paymentMethodId)
				.first();

			if (existingFlag) {
				throw new BadRequestException(
					"Não é possível ter uma mesma bandeira duas vezes",
					400,
					"E_ERR",
				);
			}

			const flag = await PaymentMethodFlag.create(
				{
					economic_group_id: group.id,
					payment_method_id: data.paymentMethodId,
					tef_flag_id: data.tefFlagId,
					tef_acquirer_id: data.tefAcquirerId,
					checking_account_id: data.checkingAccountId,
					maxInstallments: data.maxInstallments,
					daysUntilTransfer: data.daysUntilTransfer,
				},
				{
					client: trx,
				},
			);

			await flag.related("installments").createMany(
				Array.from({ length: data.maxInstallments ?? 0 }, (_, k) => ({
					installment: k + 1,
					fee: 0,
				})),
				{
					client: trx,
				},
			);

			return flag;
		});
	}

	async updatePaymentMethodFlag(
		unitId: string,
		id: string,
		data: IUpdatePaymentMethodFlagData,
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const flag = await PaymentMethodFlag.query()
				.useTransaction(trx)
				.where("economic_group_id", group.id)
				.where("id", id)
				.preload("installments")
				.first();

			if (!flag) {
				throw this.sharedService.ResourceNotFound();
			}

			const updatedFlag = await flag
				.merge({
					economic_group_id: group.id,
					tef_acquirer_id: data.tefAcquirerId,
					maxInstallments: data.maxInstallments,
					daysUntilTransfer: data.daysUntilTransfer,
					active: data.active,
				})
				.useTransaction(trx)
				.save();

			if (updatedFlag.maxInstallments > flag.installments.length) {
				await flag.related("installments").createMany(
					Array.from(
						{
							length:
								(updatedFlag.maxInstallments ?? 0) -
								updatedFlag.installments.length,
						},
						(_, k) => ({
							installment: updatedFlag.installments.length + k + 1,
							fee: 0,
						}),
					),
					{
						client: trx,
					},
				);
			}

			if (updatedFlag.maxInstallments < flag.installments.length) {
				await Promise.all(
					flag.installments
						.filter((i) => i.installment > (updatedFlag.maxInstallments ?? 0))
						.map(async (installment) => {
							return installment.useTransaction(trx).delete();
						}),
				);
			}

			return updatedFlag;
		});
	}

	async createPaymentMethodFee(
		unitId: string,
		data: ICreatePaymentMethodFeeData,
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		return PaymentMethodFee.create({
			economic_group_id: group.id,
			business_unit_id: unitId,
			payment_method_id: data.paymentMethodId,
			payment_method_flag_id: data.paymentMethodFlagId,
			installments: data.installments,
			fee: data.fee,
		});
	}

	async updatePaymentMethodFlagInstallment(
		unitId: string,
		id: number,
		data: { fee: number },
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const installment = await PaymentMethodFlagInstallment.query()
				.useTransaction(trx)
				.where("id", id)
				.preload("flag")
				.first();

			if (!installment || installment.flag.economic_group_id !== group.id) {
				throw this.sharedService.ResourceNotFound();
			}

			return installment
				.merge({
					fee: data.fee,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async createBusinessUnitCheckAccountPaymentMethod(
		authCtx: AuthContext,
		data: {
			// businessUnitId: string;
			checkingAccountId: string;
			paymentMethodId: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const units = await BusinessUnit.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id);

			await BusinessUnitCheckingAccountPaymentMethod.updateOrCreateMany(
				["business_unit_id", "payment_method_id"],
				units.map((unit) => ({
					business_unit_id: unit.id,
					payment_method_id: data.paymentMethodId,
					checking_account_id: data.checkingAccountId,
					active: true,
				})),
				{ client: trx },
			);
		});
	}

	async updateBusinessUnitCheckAccountPaymentMethod(
		authCtx: AuthContext,
		data: {
			id: number;
			checkingAccountId: string;
			active: boolean;
		}[],
	) {
		await Database.transaction(async (trx) => {
			const units = await BusinessUnit.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id);

			const tasks = data.map((elem) => {
				return BusinessUnitCheckingAccountPaymentMethod.query()
					.update({
						checking_account_id: elem.checkingAccountId,
						active: elem.active,
					})
					.where("id", elem.id)
					.whereIn(
						"business_unit_id",
						units.map((unit) => unit.id),
					)
					.useTransaction(trx);
			});

			await Promise.all(tasks);
		});
	}

	async listBusinessUnitCheckingAccountPaymentMethod(
		authCtx: AuthContext,
		data: {
			businessUnitId?: string;
			paymentMethodId?: string;
		},
	) {
		const qb = BusinessUnitCheckingAccountPaymentMethod.query()
			.preload("paymentMethod", (query) => {
				query.select("id", "description");
			})
			.preload("checkingAccount", (query) => {
				query.select("id", "description");
			})
			.preload("businessUnit", (query) => {
				query.select("id", "identification");
			})
			.whereHas("businessUnit", (query) => {
				query.where("economic_group_id", authCtx.group.id);
			});

		if (data.businessUnitId) {
			qb.where("business_unit_id", data.businessUnitId);
		}

		if (data.paymentMethodId) {
			qb.where("payment_method_id", data.paymentMethodId);
		}

		return qb;
	}
}
