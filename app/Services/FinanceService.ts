import { inject } from "@adonisjs/fold";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Attendance from "App/Models/Attendance";
import Banking, {
	BankingOriginFlag,
	BankingStatus,
	BankingType,
} from "App/Models/Banking";
import Bordero, { TBorderoType } from "App/Models/Bordero";
import CheckingAccount from "App/Models/CheckingAccount";
import DailyCashier, { DailyCashierStatus } from "App/Models/DailyCashier";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import Finance, {
	FinanceAccept,
	FinanceOriginDownFlag,
	FinanceOriginFlag,
	FinanceStatus,
	FinanceType,
} from "App/Models/Finance";
import FinanceReversal, {
	FinanceReversalType,
} from "App/Models/FinanceReversal";
import PaymentMethod from "App/Models/PaymentMethod";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import {
	IFinanceDownData,
	IFinanceReversalData,
	IUpdateFinance,
	IUpsertFinance,
} from "Contracts/interfaces/IFinanceData";
import { format } from "date-fns";
import { DateTime } from "luxon";

interface ISearch {
	fromIssueDate?: string;
	toIssueDate?: string;

	fromExpirationDate?: string;
	toExpirationDate?: string;

	fromPaymentDate?: string;
	toPaymentDate?: string;

	ids?: string[];
	client?: string;
	document?: string;
	fiscalNote?: string;
	paymentMethod?: string;
	nsu?: string;
	status?: string;
	accept?: string;
	reconciled?: string;
	type?: string;
	unit?: string;
	plan?: string;
	competence?: string;

	groupBorderos?: string;
}

@inject()
export default class FinanceService {
	constructor(private sharedService: SharedService) {}

	async index(unitId: string, data: ISearch) {
		const units = [unitId];
		if (data.unit) {
			units.push(data.unit);
		}

		const qb = Finance.query()
			.whereIn("business_unit_id", units)
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("accountPlan");
				});
			})
			.preload("paymentMethod", (query) => {
				query.preload("checkingAccount", (query) => {
					query.select(["id", "description"]);
				});
			})
			.preload("accountPlan")
			.preload("checkingAccount")
			.preload("flag", (query) => {
				query.select(["id", "description"]);
			});

		if (data.ids && Array.isArray(data.ids)) {
			qb.whereIn("id", data.ids);
		}

		if (data.fromIssueDate) {
			qb.whereRaw("issue_date::date >= ?", [data.fromIssueDate]);
		}

		if (data.toIssueDate) {
			qb.whereRaw("issue_date::date <= ?", [data.toIssueDate]);
		}

		if (data.fromExpirationDate) {
			qb.whereRaw("expiration_date::date >= ?", [data.fromExpirationDate]);
		}

		if (data.toExpirationDate) {
			qb.whereRaw("expiration_date::date <= ?", [data.toExpirationDate]);
		}

		if (data.fromPaymentDate) {
			qb.whereRaw("payment_date::date >= ?", [data.fromPaymentDate]);
		}

		if (data.toPaymentDate) {
			qb.whereRaw("payment_date::date <= ?", [data.toPaymentDate]);
		}

		if (data.client) {
			qb.where("client_id", data.client);
		}

		if (data.document) {
			qb.whereILike("document", `%${data.document}%`);
		}

		if (data.fiscalNote) {
			qb.whereILike("fiscalNote", `%${data.fiscalNote}%`);
		}

		if (data.paymentMethod) {
			qb.where("payment_method_id", data.paymentMethod);
		}

		if (data.nsu) {
			qb.where("nsuDocument", data.nsu);
		}

		if (data.status) {
			qb.where("status", data.status);
		} else {
			qb.whereNot("status", FinanceStatus.E);
		}

		if (data.accept) {
			qb.where("accept", data.accept);
		}

		if (data.reconciled) {
			qb.where("reconciled", data.reconciled === "true");
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		if (data.plan) {
			qb.where("account_plan_id", data.plan);
		}

		if (data.competence) {
			qb.where("competence_date", data.competence);
		}

		return qb;
	}

	async reducedIndex(unitId: string, data: ISearch) {
		const units = [unitId];
		if (data.unit) {
			units.push(data.unit);
		}

		const qb = Database.from("finances")
			.select(
				Database.raw(`
        finances.id,
        finances.type,
        finances.document,
        finances.installment,
        finances.issue_date,
        finances.expiration_date,
        finances.payment_date,
        finances.value,
        finances.total_value,
        finances.payment_value,
        finances.origin_flag,
        finances.origin_down_flag,
        finances.accept,
        finances.status,
        finances.competence_date,
        finances.fiscal_note,
        finances.nsu_document,
        finances.qty_installments,
        finances.bordero_id,
        patients.name             as client,
        payment_methods.description            as payment_method,
        tef_flags.description     as tef_flag,
        account_plans.description as account_plan`),
			)
			.joinRaw("join patients on finances.client_id = patients.id", [])
			.joinRaw(
				"left join account_plans on finances.account_plan_id = account_plans.id",
				[],
			)
			.joinRaw(
				"left join payment_methods on finances.payment_method_id = payment_methods.id",
				[],
			)
			.joinRaw("left join tef_flags on finances.tef_flag_id = tef_flags.id", [])
			.whereNull("finances.deleted_at");

		if (data.ids && Array.isArray(data.ids)) {
			qb.whereIn("finances.id", data.ids);
		}

		if (data.fromIssueDate) {
			qb.whereRaw("finances.issue_date::date >= ?", [data.fromIssueDate]);
		}

		if (data.toIssueDate) {
			qb.whereRaw("finances.issue_date::date <= ?", [data.toIssueDate]);
		}

		if (data.fromExpirationDate) {
			qb.whereRaw("finances.expiration_date::date >= ?", [
				data.fromExpirationDate,
			]);
		}

		if (data.toExpirationDate) {
			qb.whereRaw("finances.expiration_date::date <= ?", [
				data.toExpirationDate,
			]);
		}

		if (data.fromPaymentDate) {
			qb.whereRaw("finances.payment_date::date >= ?", [data.fromPaymentDate]);
		}

		if (data.toPaymentDate) {
			qb.whereRaw("finances.payment_date::date <= ?", [data.toPaymentDate]);
		}

		if (data.client) {
			qb.where("finances.client_id", data.client);
		}

		if (data.document) {
			qb.whereILike("finances.document", `%${data.document}%`);
		}

		if (data.fiscalNote) {
			qb.whereILike("finances.fiscalNote", `%${data.fiscalNote}%`);
		}

		if (data.paymentMethod) {
			qb.where("finances.payment_method_id", data.paymentMethod);
		}

		if (data.nsu) {
			qb.where("finances.nsuDocument", data.nsu);
		}

		if (data.status) {
			qb.where("finances.status", data.status);
		} else {
			qb.whereNot("finances.status", FinanceStatus.E);
		}

		if (data.accept) {
			qb.where("finances.accept", data.accept);
		}

		if (data.reconciled) {
			qb.where("finances.reconciled", data.reconciled === "true");
		}

		if (data.type) {
			qb.where("finances.type", data.type);
		}

		if (data.plan) {
			qb.where("finances.account_plan_id", data.plan);
		}

		if (data.competence) {
			qb.where("finances.competence_date", data.competence);
		}

		if (data?.groupBorderos === "sim") {
			qb.union((builder) => {
				builder
					.from("borderos")
					.select(
						Database.raw(`
        borderos.id,
        borderos.type,
        borderos.document,
        -1                                                                      as installment,
        borderos.issue_date,
        null                                                                    as expiration_date,
        borderos.payment_date,
        borderos.bordero_value                                                  as value,
        borderos.total_value,
        borderos.payment_value,
        'FINANCEIRO'                                                            as origin_flag,
        case when borderos.payment_date is null then null else 'FINANCEIRO' end as origin_down_flag,
        'SIM'                                                                   as accept,
        borderos.status,
        borderos.competence_date,
        null                                                                    as fiscal_note,
        null                                                                    as nsu_document,
        1                                                                       as qty_installments,
        borderos.id                                                             as bordero_id,
        patients.name                                                           as client,
        payment_methods.description                                             as payment_method,
        tef_flags.description                                                   as tef_flag,
        account_plans.description                                               as account_plan
          `),
					)
					.joinRaw("join patients on borderos.client_id = patients.id", [])
					.joinRaw(
						"left join account_plans on borderos.account_plan_id = account_plans.id",
						[],
					)
					.joinRaw(
						"left join payment_methods on borderos.payment_method_id = payment_methods.id",
						[],
					)
					.joinRaw(
						"left join tef_flags on borderos.tef_flag_id = tef_flags.id",
						[],
					)
					.whereIn("borderos.business_unit_id", units);
				// .whereNull("borderos.deleted_at")

				if (data.type) {
					builder.whereILike("borderos.type", data.type);
				}
			});
		}

		return qb;
	}

	// 2.1
	async createFinance(authCtx: AuthContext, data: IUpsertFinance) {
		if (authCtx.unit.unitConfig.requiresFinanceClient && !data.clientId) {
			throw new BadRequestException(
				"É preciso adicionar cliente na nota para essa unidade",
				400,
				"BAD_REQUEST",
			);
		}
		return await Database.transaction(async (trx) => {
			const paymentMethod = await PaymentMethod.findOrFail(
				data.paymentMethodId,
				{
					client: trx,
				},
			);
			const dailyMovement = await DailyMovement.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("status", DailyMovementStatus.A)
				.first();

			const dailyCashier = await this.sharedService.getContextCashier(
				authCtx,
				trx,
			);

			const discount = data.originalValue * (paymentMethod.fee / 100);

			return Finance.create(
				{
					daily_movement_id: dailyMovement?.id,
					daily_cashier_id: dailyCashier?.id,
					status: FinanceStatus.A,
					feeDiscountPercentage: paymentMethod.fee,
					feeDiscountValue: discount,
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_id: data.clientId,
					type: data.type,
					account_plan_id: data.accountPlanId,
					payment_method_id: data.paymentMethodId,
					document: data.document,
					historic: data.historic,
					issueDate: data.issueDate,
					expirationDate: data.expirationDate,
					originalValue: data.originalValue,
					value: data.originalValue - discount,
					totalValue:
						data.originalValue +
						(data.feeValue || 0) +
						(data.increaseValue || 0) -
						(data.discountValue || 0) -
						discount,
					accept: data.accept,
					installment: data.installment,
					originFlag: data.originFlag,
					checking_account_id:
						data.checkingAccountId ?? paymentMethod.checkingAccountId,
					qtyInstallments: data.qtyInstallments,

					paymentDate: data.paymentDate,
					downDate: data.downDate,
					paymentValue: data.paymentValue,
					feeValue: data.feeValue ?? 0,
					feePercentage: data.feePercentage ?? 0,
					discountValue: data.discountValue ?? 0,
					discountPercentage: data.discountPercentage ?? 0,
					additionPercentage: data.increasePercentage,
					additionValue: data.increaseValue,
					observation: data.observation,
					competenceDate: data.competenceDate,
					fiscalNote: data.fiscalNote,
					userDocument: data.userDocument,
					nsuDocument: data.nsuDocument,
					barCode: data.barCode,
					bank: data.bank,
					agency: data.agency,
					account: data.account,
					acquirer_id: data.tefAcquirerId,
					tef_flag_id: data.tefFlagId,
				},
				{
					client: trx,
				},
			);
		});
	}

	// 2.1
	async createMultipleFinances(authCtx: AuthContext, data: IUpsertFinance[]) {
		if (
			authCtx.unit.unitConfig.requiresFinanceClient &&
			data.some((item) => !item.clientId)
		) {
			throw new BadRequestException(
				"É preciso adicionar cliente na nota para essa unidade",
				400,
				"BAD_REQUEST",
			);
		}

		await Database.transaction(async (trx) => {
			const tasks = data.map(async (item) => {
				const paymentMethod = await PaymentMethod.findOrFail(
					item.paymentMethodId,
					{
						client: trx,
					},
				);
				const dailyMovement = await DailyMovement.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyMovementStatus.A)
					.first();
				const dailyCashier = await DailyCashier.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyMovementStatus.A)
					.where("user_who_opened_id", authCtx.user.id)
					.first();

				const discount = item.originalValue * (paymentMethod.fee / 100);

				return Finance.create(
					{
						daily_movement_id: dailyMovement?.id,
						daily_cashier_id: dailyCashier?.id,
						status: FinanceStatus.A,
						feeDiscountPercentage: paymentMethod.fee,
						feeDiscountValue: discount,
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						client_id: item.clientId,
						type: item.type,
						account_plan_id: item.accountPlanId,
						payment_method_id: item.paymentMethodId,
						document: item.document,
						historic: item.historic,
						issueDate: item.issueDate,
						expirationDate: item.expirationDate,
						originalValue: item.originalValue,
						value: item.originalValue - discount,
						totalValue:
							item.originalValue +
							(item.feeValue || 0) +
							(item.increaseValue || 0) -
							(item.discountValue || 0) -
							discount,
						accept: item.accept,
						installment: item.installment,
						originFlag: item.originFlag,
						checking_account_id:
							item.checkingAccountId ?? paymentMethod.checkingAccountId,
						qtyInstallments: item.qtyInstallments,

						paymentDate: item.paymentDate,
						downDate: item.downDate,
						paymentValue: item.paymentValue,
						feeValue: item.feeValue ?? 0,
						feePercentage: item.feePercentage ?? 0,
						discountValue: item.discountValue ?? 0,
						discountPercentage: item.discountPercentage ?? 0,
						additionPercentage: item.increasePercentage,
						additionValue: item.increaseValue,
						observation: item.observation,
						competenceDate: item.competenceDate,
						fiscalNote: item.fiscalNote,
						userDocument: item.userDocument,
						nsuDocument: item.nsuDocument,
						barCode: item.barCode,
						bank: item.bank,
						agency: item.agency,
						account: item.account,
						acquirer_id: item.tefAcquirerId,
						tef_flag_id: item.tefFlagId,
					},
					{
						client: trx,
					},
				);
			});

			await Promise.all(tasks);
		});
	}

	// 2.2
	async updateFinance(
		unitId: string,
		_: User,
		id: string,
		data: IUpdateFinance,
	) {
		const paymentMethod = await PaymentMethod.findOrFail(data.paymentMethodId);

		const discount = data.originalValue * (paymentMethod.fee / 100);

		const finance = await Finance.query()
			.where("id", id)
			.where("business_unit_id", unitId)
			.first();

		if (!finance) {
			throw this.sharedService.ResourceNotFound();
		}

		return finance
			.merge({
				account_plan_id: data.accountPlanId,
				payment_method_id: data.paymentMethodId,
				historic: data.historic,
				expirationDate: data.expirationDate,
				originalValue: data.originalValue,
				value: data.originalValue - discount,
				totalValue:
					data.originalValue +
					(data.feeValue || finance.feeValue) +
					(data.increaseValue || finance.additionValue) -
					(data.discountValue || finance.discountValue) -
					discount,
				reconciled: data.reconciled,

				checking_account_id:
					paymentMethod.checkingAccountId ?? data.checkingAccountId,

				feeValue: data.feeValue ?? 0,
				feePercentage: data.feePercentage ?? 0,
				discountValue: data.discountValue ?? 0,
				discountPercentage: data.discountPercentage ?? 0,
				additionPercentage: data.increasePercentage,
				additionValue: data.increaseValue,
				observation: data.observation,
				competenceDate: data.competenceDate,
				fiscalNote: data.fiscalNote,
				userDocument: data.userDocument,
				nsuDocument: data.nsuDocument,
				barCode: data.barCode,
				bank: data.bank,
				agency: data.agency,
				account: data.account,
				acquirer_id: data.tefAcquirerId,
				tef_flag_id: data.tefFlagId,
			})
			.save();
	}

	async updateFinanceDown(
		authCtx: AuthContext,
		data: { items: IFinanceDownData[] },
	) {
		return Database.transaction(async (trx) => {
			for await (const elem of data.items) {
				const finance = await Finance.query()
					.where("id", elem.financeId)
					.where("business_unit_id", authCtx.unit.id)
					.useTransaction(trx)
					.first();

				if (!finance) {
					throw this.sharedService.ResourceNotFound();
				}

				const checkingAccount = await CheckingAccount.query()
					.useTransaction(trx)
					.where("id", elem.checkingAccountId)
					.first();

				if (!checkingAccount) {
					throw this.sharedService.ResourceNotFound();
				}

				finance.merge({
					checking_account_id: elem.checkingAccountId,
					status: FinanceStatus.B,
					downDate: DateTime.now(),
					paymentValue: elem.paymentValue,
					paymentDate: elem.paymentDate,
					originDownFlag: elem.originDownFlag,

					feeValue: elem.feeValue ?? 0,
					feePercentage: elem.feePercentage ?? 0,
					discountValue: elem.discountValue ?? 0,
					discountPercentage: elem.discountPercentage ?? 0,

					additionPercentage: elem.increasePercentage,
					additionValue: elem.increaseValue,
					observation: elem.observation,

					competenceDate: elem.competenceDate,
					fiscalNote: elem.fiscalNote,
					userDocument: elem.userDocument,
					nsuDocument: elem.nsuDocument,
					barCode: elem.barCode,
					bank: elem.bank,
					agency: elem.agency,
					account: elem.account,
					acquirer_id: elem.tefAcquirerId,
					tef_flag_id: elem.tefFlagId,
				});

				const banking = await Banking.create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						client_id: finance.client_id,
						account_plan_id: finance.account_plan_id,
						payment_method_id: finance.payment_method_id,
						checking_account_id: elem.checkingAccountId,
						daily_movement_id: finance.daily_movement_id,
						daily_cashier_id: finance.daily_cashier_id,
						finance_id: finance.id,

						paymentMethodDiscountValue: finance.feeDiscountValue,
						paymentMethodDiscountPercentage: finance.feeDiscountPercentage,

						type:
							finance.type === FinanceType.C ? BankingType.C : BankingType.D,
						document: finance.document,
						historic: finance.historic,
						issueDate: elem.paymentDate,
						documentValue: finance.value,
						feeValue: finance.feeValue,
						feePercentage: finance.feePercentage,
						discountValue: finance.discountValue,
						discountPercentage: finance.discountPercentage,
						totalValue: elem.paymentValue,
						reconciled: true,
						installment: finance.installment,
						originFlag: BankingOriginFlag.F,
						observation: finance.observation,
						status: BankingStatus.B,
						prevBalance: checkingAccount?.balance,
						balance:
							finance.type === FinanceType.C
								? (checkingAccount?.balance ?? 0) + (finance.paymentValue ?? 0)
								: (checkingAccount?.balance ?? 0) - (finance.paymentValue ?? 0),

						competenceDate: finance.competenceDate,
						fiscalNote: finance.fiscalNote,
						userDocument: finance.userDocument,
						nsuDocument: finance.nsuDocument,
						barCode: finance.barCode,
					},
					{
						client: trx,
					},
				);

				await checkingAccount
					.merge({
						balance:
							finance.type === FinanceType.C
								? checkingAccount.balance + (finance.paymentValue ?? 0)
								: checkingAccount.balance - (finance.paymentValue ?? 0),
					})
					.useTransaction(trx)
					.save();

				await FinanceReversal.create(
					{
						type: FinanceReversalType.B,
						downDate: DateTime.now(),
						reversalOrigin: elem.originDownFlag,

						economic_group_id: finance.economic_group_id,
						business_unit_id: finance.business_unit_id,
						finance_id: finance.id,
						client_id: finance.client_id,
						checking_account_id: finance.checking_account_id ?? undefined,
						account_plan_id: finance.account_plan_id,
						payment_method_id: finance.payment_method_id,
						banking_id: banking.id,

						feeDiscountPercentage: finance.feeDiscountPercentage,
						feeDiscountValue: finance.feeDiscountValue,
						expirationDate: finance.expirationDate,
						paymentDate: finance.paymentDate ?? undefined,
						totalValue: finance.totalValue,
						paymentValue: finance.paymentValue ?? undefined,
						feeValue: finance.feeValue,
						feePercentage: finance.feePercentage,
						discountValue: finance.discountValue,
						discountPercentage: finance.discountPercentage,
						additionPercentage: finance.additionPercentage,
						additionValue: finance.additionValue,

						competenceDate: finance.competenceDate,
						fiscalNote: finance.fiscalNote,
						userDocument: finance.userDocument,
						nsuDocument: finance.nsuDocument,
						barCode: finance.barCode,
						bank: finance.bank,
						agency: finance.agency,
						account: finance.account,
						tef_flag_id: finance.tef_flag_id,
						acquirer_id: finance.acquirer_id,
					},
					{
						client: trx,
					},
				);

				await finance
					.merge({
						banking_id: banking.id,
					})
					.useTransaction(trx)
					.save();
			}
		});
	}

	// 2.7
	async updateFinanceReversal(
		unitId: string,
		id: string,
		data: IFinanceReversalData,
	) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const finance = await Finance.query()
				.where("id", id)
				.where("business_unit_id", unitId)
				.first();

			if (!finance) {
				throw this.sharedService.ResourceNotFound();
			}

			const checkingAccount = await CheckingAccount.find(
				finance.checking_account_id,
			);

			const balance = checkingAccount?.balance ?? 0;

			const banking = await Banking.create(
				{
					economic_group_id: group.id,
					business_unit_id: unitId,
					client_id: finance.client_id,
					account_plan_id: finance.account_plan_id,
					payment_method_id: finance.payment_method_id,
					checking_account_id: finance.checking_account_id ?? undefined,
					daily_movement_id: finance.daily_movement_id,
					daily_cashier_id: finance.daily_cashier_id,
					finance_id: finance?.id,

					paymentMethodDiscountValue: finance.feeDiscountValue,
					paymentMethodDiscountPercentage: finance.feeDiscountPercentage,

					type: finance.type === FinanceType.C ? BankingType.D : BankingType.C,
					document: finance.document,
					historic: finance.historic,
					issueDate: DateTime.now(),
					documentValue: finance.value,
					feeValue: finance.feeValue,
					feePercentage: finance.feePercentage,
					discountValue: finance.discountValue,
					discountPercentage: finance.discountPercentage,
					totalValue: finance.paymentValue ?? -1,
					reconciled: true,
					installment: finance.installment,
					originFlag: BankingOriginFlag.F,
					observation: finance.observation,
					status: BankingStatus.B,
					prevBalance: balance,
					balance:
						finance.type === FinanceType.C
							? balance - (finance.paymentValue ?? 0)
							: balance + (finance.paymentValue ?? 0),

					competenceDate: finance.competenceDate,
					fiscalNote: finance.fiscalNote,
					userDocument: finance.userDocument,
					nsuDocument: finance.nsuDocument,
					barCode: finance.barCode,
				},
				{
					client: trx,
				},
			);

			await FinanceReversal.create(
				{
					type: FinanceReversalType.E,
					downDate: DateTime.now(),
					reversalOrigin: data.originDownFlag,
					reversalReason: data.reason,

					economic_group_id: finance.economic_group_id,
					business_unit_id: finance.business_unit_id,
					finance_id: finance?.id,
					client_id: finance.client_id,
					checking_account_id: finance.checking_account_id ?? undefined,
					account_plan_id: finance.account_plan_id,
					payment_method_id: finance.payment_method_id,
					banking_id: banking.id,

					feeDiscountPercentage: finance.feeDiscountPercentage,
					feeDiscountValue: finance.feeDiscountValue,
					expirationDate: finance.expirationDate,
					paymentDate: finance.paymentDate ?? undefined,
					totalValue: finance.totalValue,
					paymentValue: finance.paymentValue ?? undefined,
					feeValue: finance.feeValue,
					feePercentage: finance.feePercentage,
					discountValue: finance.discountValue,
					discountPercentage: finance.discountPercentage,
					additionPercentage: finance.additionPercentage,
					additionValue: finance.additionValue,

					competenceDate: finance.competenceDate,
					fiscalNote: finance.fiscalNote,
					userDocument: finance.userDocument,
					nsuDocument: finance.nsuDocument,
					barCode: finance.barCode,
					bank: finance.bank,
					agency: finance.agency,
					account: finance.account,
					tef_flag_id: finance.tef_flag_id,
					acquirer_id: finance.acquirer_id,
				},
				{
					client: trx,
				},
			);

			if (checkingAccount) {
				await checkingAccount
					.merge({
						balance:
							finance.type === FinanceType.C
								? checkingAccount.balance - (finance.paymentValue ?? 0)
								: checkingAccount.balance + (finance.paymentValue ?? 0),
					})
					.useTransaction(trx)
					.save();
			}

			return finance
				.merge({
					checking_account_id: null,
					banking_id: undefined,

					paymentDate: null,
					downDate: null,
					paymentValue: null,
					status: FinanceStatus.A,
					reversalReason: data.reason,
					originDownFlag: undefined,
				})
				.useTransaction(trx)
				.save();
		});
	}

	// 2.3
	async deleteFinance(unitId: string, id: string) {
		const finance = await Finance.query()
			.where("id", id)
			.where("business_unit_id", unitId)
			.first();

		if (!finance) {
			throw this.sharedService.ResourceNotFound();
		}

		if (finance.status !== FinanceStatus.A) {
			throw new BadRequestException(
				"Não é possível excluir um lançamento que não está ativo",
				400,
				"BAD_REQUEST",
			);
		}

		if (finance.originFlag !== FinanceOriginFlag.F) {
			throw new BadRequestException(
				"Não é possível excluir um lançamento que foi criado pelo financeiro",
				400,
				"BAD_REQUEST",
			);
		}

		return finance
			.merge({
				status: FinanceStatus.E,
				deletedAt: DateTime.now(),
			})
			.save();
	}

	async acceptMany(authCtx: AuthContext, data: { ids: string[] }) {
		await Database.transaction(async (trx) => {
			const finances = await Finance.query()
				.useTransaction(trx)
				.whereIn("id", data.ids)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id);

			if (finances.length !== data.ids.length) {
				throw new BadRequestException(
					"Não foi possível encontrar todos os lançamentos",
					400,
					"BAD_REQUEST",
				);
			}

			await Finance.query()
				.useTransaction(trx)
				.whereIn("id", data.ids)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.update({
					accept: FinanceAccept.S,
				});
		});
	}

	async getExpiringExpenses(authCtx: AuthContext) {
		const finances = await Finance.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("type", FinanceType.D)
			.where("status", FinanceStatus.A)
			.whereRaw("expiration_date::date = now()::date", [])
			.whereNull("payment_date")
			.preload("paymentMethod")
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("accountPlan");
				});
			});

		const dataSet = new Map<string, { value: number }>();
		finances.forEach((elem) => {
			const key = elem?.client_id ?? "__";
			if (!dataSet.has(key)) {
				dataSet.set(key, { value: 0 });
			}

			const entry = dataSet.get(key)!;
			entry.value += elem.value;

			dataSet.set(key, entry);
		});

		return Array.from(dataSet.keys()).map((elem) => ({
			supplier:
				finances.find((e) => e.client_id === elem)?.client?.name ??
				"Título sem fornecedor",
			value: dataSet.get(elem)?.value ?? 0,
		}));

		// return finances.map(elem => ({
		//   id: elem.id,
		//   document: elem.document,
		//   installment: elem.installment,
		//   paymentMethod: {
		//     id: elem.paymentMethod.id,
		//     description: elem.paymentMethod.description,
		//   },
		//   totalValue: elem.totalValue,
		//   supplier: {
		//     id: elem.client.id,
		//     name: elem.client.name,
		//     accountPlan: this.sharedService.captureGroup(
		//       elem.client?.tutor?.accountPlan,
		//       v => ({
		//         id: v.id,
		//         description: v.description,
		//       }),
		//     ),
		//   },
		// }));
	}

	async getExpiringPayments(authCtx: AuthContext) {
		const today = DateTime.now();

		const finances = await Finance.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("type", FinanceType.C)
			.where("status", FinanceStatus.A)
			.whereBetween("expiration_date", [
				today.startOf("day").toISO() ?? "",
				today.endOf("day").toISO() ?? "",
			])
			.whereNull("payment_date")
			.preload("paymentMethod")
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("accountPlan");
				});
			});

		return finances.map((elem) => ({
			id: elem.id,
			document: elem.document,
			installment: elem.installment,
			paymentMethod: {
				id: elem.paymentMethod.id,
				description: elem.paymentMethod.description,
			},
			totalValue: elem.value,
			supplier: {
				id: elem.client.id,
				name: elem.client.name,
				accountPlan: this.sharedService.captureGroup(
					elem.client?.tutor?.accountPlan,
					(v) => ({
						id: v.id,
						description: v.description,
					}),
				),
			},
		}));
	}

	async getCheckingAccountsResume(authCtx: AuthContext) {
		const result = await CheckingAccount.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("active", true);

		return result.map((elem) => ({
			id: elem.id,
			description: elem.description,
			accountNumber: elem.accountNumber,
			balance: elem.balance,
		}));
	}

	async getOpenDailyCashiers(authCtx: AuthContext) {
		const result = await DailyCashier.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("status", DailyCashierStatus.A)
			.preload("userWhoOpened");

		return result.map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			openingBalance: this.parseDecimal(elem.openingBalance),
			cashierFunds: this.parseDecimal(elem.cashierFunds),
			salesTotal: this.parseDecimal(elem.salesTotal),
			receiptsTotal: this.parseDecimal(elem.receiptsTotal),
			cashierTotal: this.parseDecimal(elem.cashierTotal),
			openingDate: elem.openingDate,

			userWhoOpened: {
				id: elem.userWhoOpened.id,
				name: elem.userWhoOpened.name,
			},
		}));
	}

	async getClosedDailyCashiers(authCtx: AuthContext) {
		const result = await DailyCashier.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("status", DailyCashierStatus.F)
			.preload("userWhoClosed");

		return result.map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			openingBalance: this.parseDecimal(elem.openingBalance),
			cashierFunds: this.parseDecimal(elem.cashierFunds),
			salesTotal: this.parseDecimal(elem.salesTotal),
			receiptsTotal: this.parseDecimal(elem.receiptsTotal),
			cashierTotal: this.parseDecimal(elem.cashierTotal),
			openingDate: elem.openingDate,
			closingDate: elem.closingDate,

			userWhoClosed: {
				id: elem.userWhoClosed.id,
				name: elem.userWhoClosed.name,
			},
		}));
	}

	async getRevisedDailyCashiers(authCtx: AuthContext) {
		const result = await DailyCashier.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("status", DailyCashierStatus.R)
			.preload("userWhoRevised");

		return result.map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			openingBalance: this.parseDecimal(elem.openingBalance),
			cashierFunds: this.parseDecimal(elem.cashierFunds),
			salesTotal: this.parseDecimal(elem.salesTotal),
			receiptsTotal: this.parseDecimal(elem.receiptsTotal),
			cashierTotal: this.parseDecimal(elem.cashierTotal),
			openingDate: elem.openingDate,
			closingDate: elem.closingDate,
			revisionDate: elem.revisionDate,

			userWhoRevised: {
				id: elem.userWhoRevised.id,
				name: elem.userWhoRevised.name,
			},
		}));
	}

	async getTodayDailyCashiers(authCtx: AuthContext) {
		const today = DateTime.now();

		const result = await DailyCashier.query()
			.where("business_unit_id", authCtx.unit.id)
			.whereBetween("opening_date", [
				today.startOf("day").toISO() ?? "",
				today.endOf("day").toISO() ?? "",
			])
			.preload("userWhoOpened");

		return result.map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			openingDate: elem.openingDate,
			closingDate: elem.closingDate,
			revisionDate: elem.revisionDate,

			openingBalance: this.parseDecimal(elem.openingBalance),
			cashierFunds: this.parseDecimal(elem.cashierFunds),
			salesTotal: this.parseDecimal(elem.salesTotal),
			receiptsTotal: this.parseDecimal(elem.receiptsTotal),
			cashierTotal: this.parseDecimal(elem.cashierTotal),

			openingUser: {
				id: elem.userWhoOpened.id,
				name: elem.userWhoOpened.name,
			},
		}));
	}

	async getOverallResume(authCtx: AuthContext) {
		// 1.8.1.1
		const first = await Database.from("finances")
			.where("business_unit_id", authCtx.unit.id)
			.where("type", FinanceType.D)
			.where("status", FinanceStatus.A)
			.whereNull("payment_date")
			.whereRaw("expiration_date::date < now()::date", [])
			.whereNull("deleted_at")
			.sum("value")
			.first();

		// 1.8.1.2
		const second = await Database.from("finances")
			.where("business_unit_id", authCtx.unit.id)
			.where("type", FinanceType.C)
			.where("status", FinanceStatus.A)
			.whereNull("payment_date")
			.whereRaw("expiration_date::date < now()::date", [])
			.whereNull("deleted_at")
			.sum("value")
			.first();

		// 1.8.1.3
		const third = await Database.from("finances")
			.where("business_unit_id", authCtx.unit.id)
			.where("type", FinanceType.D)
			.where("status", FinanceStatus.A)
			.whereNull("payment_date")
			.whereRaw("expiration_date::date >= now()::date", [])
			.whereNull("deleted_at")
			.sum("value")
			.first();

		// 1.8.1.4
		const fourth = await Database.from("finances")
			.where("business_unit_id", authCtx.unit.id)
			.where("type", FinanceType.C)
			.where("status", FinanceStatus.A)
			.whereNull("payment_date")
			.whereRaw("expiration_date::date >= now()::date", [])
			.whereNull("deleted_at")
			.sum("value")
			.first();

		// 1.8.1.5
		const fifth = await Database.from("checking_accounts")
			.where("business_unit_id", authCtx.unit.id)
			.andWhereNull("deleted_at")
			.first();

		return [
			{
				type: "VencidosAPagar",
				total: first.sum ?? 0,
			},
			{
				type: "VencidosAReceber",
				total: second.sum ?? 0,
			},
			{
				type: "FuturosAPagar",
				total: third.sum ?? 0,
			},
			{
				type: "FuturosAReceber",
				total: fourth.sum ?? 0,
			},
			{
				type: "ContasCorrentes",
				total: this.parseDecimal(fifth.balance) ?? 0,
			},
		];
	}

	async getOpenAttendances(authCtx: AuthContext) {
		const result = await Attendance.query()
			.where("business_unit_id", authCtx.unit.id)
			.whereNull("end_date")
			.preload("tutor")
			.preload("patient")
			.preload("openUser")
			.preload("scheduleService")
			.orderBy("start_date", "desc");

		return result.map((elem) => ({
			id: elem.id,
			scheduleId: elem.schedule_id,
			tutor: this.sharedService.captureGroup(elem.tutor, (v) => ({
				id: v.id,
				name: v.name,
			})),
			patient: this.sharedService.captureGroup(elem.patient, (v) => ({
				id: v.id,
				name: v.name,
			})),
			openUser: this.sharedService.captureGroup(elem.openUser, (v) => ({
				id: v.id,
				name: v.name,
			})),
			scheduleService: this.sharedService.captureGroup(
				elem.scheduleService,
				(v) => ({
					id: v.id,
					description: v.description,
				}),
			),
		}));
	}

	async createBordero(
		authCtx: AuthContext,
		data: {
			type: TBorderoType;
		},
	) {
		return await Database.transaction(async (trx) => {
			const bordero = await Bordero.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,

					type: data.type,
					issueDate: DateTime.now(),
					borderoDate: DateTime.now(),
					competenceDate: format(new Date(), "MM/yyyy"),
					borderoValue: 0,
					interestValue: 0,
					interestPercentage: 0,
					discountValue: 0,
					discountPercentage: 0,
					totalValue: 0,
					status: "Aberto",
				},
				{ client: trx },
			);

			await bordero
				.merge({
					document: `BOR-${bordero.id}`,
				})
				.useTransaction(trx)
				.save();

			return bordero;
		});
	}

	async createBorderoItem(
		authCtx: AuthContext,
		data: {
			type: TBorderoType;
			financeIds: string[];
		},
	) {
		return await Database.transaction(async (trx) => {
			const bordero = await Bordero.firstOrCreate(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					type: data.type,
					status: "Aberto",
				},
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,

					type: data.type,
					issueDate: DateTime.now(),
					borderoDate: DateTime.now(),
					borderoValue: 0,
					interestValue: 0,
					discountValue: 0,
					totalValue: 0,
					titlesQty: 0,
					status: "Aberto",
				},
				{ client: trx },
			);

			if (!bordero.document) {
				await bordero
					.merge({
						document: `BOR-${bordero.id}`,
					})
					.useTransaction(trx)
					.save();
			}

			if (bordero.status === "Fechado") {
				throw new BadRequestException(
					"Não é possível adicionar itens a um borderô fechado",
					400,
					"BAD_REQUEST",
				);
			}

			await Finance.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.whereIn("id", data.financeIds)
				.where("status", FinanceStatus.A)
				.where("type", data.type === "Credito" ? FinanceType.C : FinanceType.D)
				.update({
					bordero_id: bordero.id,
				});

			await bordero
				.merge({
					titlesQty: bordero.titlesQty + data.financeIds.length,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async closeBordero(
		authCtx: AuthContext,
		data: {
			id: string;
		},
	) {
		return await Database.transaction(async (trx) => {
			const bordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.id)
				.first();

			if (!bordero) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bordero.status === "Fechado") {
				throw new BadRequestException(
					"Não é possível fechar um borderô que já está fechado",
					400,
					"BAD_REQUEST",
				);
			}

			return bordero
				.merge({
					status: "Fechado",
				})
				.useTransaction(trx)
				.save();
		});
	}

	async reopenBordero(
		authCtx: AuthContext,
		data: {
			id: string;
		},
	) {
		return await Database.transaction(async (trx) => {
			const bordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.id)
				.first();

			if (!bordero) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bordero.status !== "Fechado") {
				throw new BadRequestException(
					"Não é possível reabrir um borderô que não está fechado",
					400,
					"BAD_REQUEST",
				);
			}

			const otherBordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.whereNot("id", data.id)
				.where("status", "Aberto")
				.first();
			if (otherBordero) {
				throw new BadRequestException(
					"Não é possível reabrir um borderô quando existe outro aberto",
					400,
					"BAD_REQUEST",
				);
			}

			return bordero
				.merge({
					status: "Aberto",
				})
				.useTransaction(trx)
				.save();
		});
	}

	async downBordero(
		authCtx: AuthContext,
		data: {
			id: string;
			checkingAccountId: string;
			paymentMethodId?: string;
			tefFlagId?: string;

			paymentDate: DateTime;
			interestValue: number;
			interestPercentage: number;
			discountValue: number;
			discountPercentage: number;
		},
	) {
		return Database.transaction(async (trx) => {
			const bordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.id)
				.first();

			if (!bordero) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bordero.status !== "Fechado") {
				throw new BadRequestException(
					"Não é possível dar baixa um borderô que não está fechado",
					400,
					"BAD_REQUEST",
				);
			}

			await bordero
				.merge({
					checking_account_id: data.checkingAccountId,
					payment_method_id: data.paymentMethodId,
					tef_flag_id: data.tefFlagId,

					downDate: DateTime.now(),
					paymentDate: data.paymentDate,
					interestValue: data.interestValue,
					interestPercentage: data.interestPercentage,
					discountValue: data.discountValue,
					discountPercentage: data.discountPercentage,
					totalValue:
						bordero.borderoValue + data.interestValue - data.discountValue,
					paymentValue:
						bordero.borderoValue + data.interestValue - data.discountValue,
					status: "Baixado",
				})
				.useTransaction(trx)
				.save();
			await bordero.refresh();

			const borderoFinances = await bordero
				.related("finances")
				.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id);

			await bordero
				.related("finances")
				.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.update({
					checking_account_id: data.checkingAccountId,

					payment_date: data.paymentDate,
					payment_value:
						bordero.borderoValue + data.interestValue - data.discountValue,
					down_date: DateTime.now(),
					origin_down_flag: FinanceOriginDownFlag.BO,
					fee_value: 0,
					fee_percentage: 0,
					discount_value: 0,
					discount_percentage: 0,
					status: FinanceStatus.B,
				});

			await this.$registerDown(trx, bordero, borderoFinances);
			await this.$registerBankingDown(trx, bordero);
		});
	}

	async revertDownBordero(
		authCtx: AuthContext,
		data: {
			id: string;

			reason: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const bordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.id)
				.first();

			if (!bordero) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bordero.status !== "Baixado") {
				throw new BadRequestException(
					"Não é possível reverter a baixa de um borderô que não está baixado",
					400,
					"BAD_REQUEST",
				);
			}

			await bordero
				.merge({
					checking_account_id: undefined,
					payment_method_id: undefined,

					paymentDate: undefined,
					downDate: undefined,
					paymentValue: undefined,
					status: "Aberto",
				})
				.useTransaction(trx)
				.save();
			await bordero.refresh();

			const borderoFinances = await bordero
				.related("finances")
				.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id);

			await Finance.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("bordero_id", bordero.id)
				.update({
					checking_account_id: null,
					payment_date: null,
					down_date: null,
					payment_value: null,
					status: FinanceStatus.A,
				});

			await this.$revertRegisterDown(trx, bordero, borderoFinances);
			await this.$revertRegisterBankingDown(trx, bordero);
		});
	}

	async updateBordero(
		authCtx: AuthContext,
		data: {
			id: string;
			clientId: string;
			checkingAccountId: string;
			paymentMethodId: string;
			accountPlanId: string;
			tefFlagId: string;

			competenceDate: string;
			borderoDate: DateTime;
			expirationDate: DateTime;
			description: string;
			history: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const bordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.id)
				.first();

			if (!bordero) {
				throw this.sharedService.ResourceNotFound();
			}

			await bordero
				.merge({
					checking_account_id: data.checkingAccountId,
					payment_method_id: data.paymentMethodId,
					tef_flag_id: data.tefFlagId,
					client_id: data.clientId,
					account_plan_id: data.accountPlanId,

					competenceDate: data.competenceDate,
					borderoDate: data.borderoDate,
					expirationDate: data.expirationDate,
					description: data.description,
					history: data.history,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async excludeBordero(
		authCtx: AuthContext,
		data: {
			id: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const bordero = await Bordero.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.id)
				.first();

			if (!bordero) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bordero.status === "Baixado") {
				throw new BadRequestException(
					"Para excluir um borderô, ele não pode estar 'Baixado'",
					400,
					"BAD_REQUEST",
				);
			}

			await bordero
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			await Finance.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("bordero_id", bordero.id)
				.update({
					bordero_id: null,
				});
		});
	}

	private async $registerDown(
		trx: TransactionClientContract,
		bordero: Bordero,
		finances: Finance[],
	) {
		await FinanceReversal.create(
			{
				type: FinanceReversalType.B,
				downDate: bordero.downDate,
				reversalOrigin: "Bordero",

				economic_group_id: bordero.economic_group_id,
				business_unit_id: bordero.business_unit_id,
				checking_account_id: bordero.checking_account_id ?? undefined,
				payment_method_id: bordero.payment_method_id,
				banking_id: bordero.bank_statement_id,
				finance_id: bordero.id,
				// account_plan_id:

				feeDiscountPercentage: bordero.discountPercentage,
				feeDiscountValue: bordero.discountValue,
				// expirationDate: bordero.date,
				paymentDate: bordero.paymentDate,
				totalValue: bordero.totalValue,
				paymentValue: bordero.paymentValue,
				feeValue: bordero.interestValue,
				feePercentage: bordero.interestPercentage,
				discountValue: bordero.discountValue,
				discountPercentage: bordero.discountPercentage,
				// additionPercentage: bordero.additionPercentage,
				// additionValue: bordero.additionValue,
				competenceDate: bordero.competenceDate,
			},
			{
				client: trx,
			},
		);

		const tasks = finances.map(async (finance) => {
			return FinanceReversal.create(
				{
					type: FinanceReversalType.B,
					downDate: DateTime.now(),
					reversalOrigin: "Bordero",

					economic_group_id: finance.economic_group_id,
					business_unit_id: finance.business_unit_id,
					finance_id: finance.id,
					client_id: finance.client_id,
					checking_account_id: finance.checking_account_id ?? undefined,
					account_plan_id: finance.account_plan_id,
					payment_method_id: finance.payment_method_id,
					banking_id: finance.banking_id,

					feeDiscountPercentage: finance.feeDiscountPercentage,
					feeDiscountValue: finance.feeDiscountValue,
					expirationDate: finance.expirationDate,
					paymentDate: finance.paymentDate ?? undefined,
					totalValue: finance.totalValue,
					paymentValue: finance.paymentValue ?? undefined,
					feeValue: finance.feeValue,
					feePercentage: finance.feePercentage,
					discountValue: finance.discountValue,
					discountPercentage: finance.discountPercentage,
					additionPercentage: finance.additionPercentage,
					additionValue: finance.additionValue,

					competenceDate: finance.competenceDate,
					fiscalNote: finance.fiscalNote,
					userDocument: finance.userDocument,
					nsuDocument: finance.nsuDocument,
					barCode: finance.barCode,
					bank: finance.bank,
					agency: finance.agency,
					account: finance.account,
					tef_flag_id: finance.tef_flag_id,
					acquirer_id: finance.acquirer_id,
				},
				{
					client: trx,
				},
			);
		});
		await Promise.all(tasks);
	}

	private async $registerBankingDown(
		trx: TransactionClientContract,
		bordero: Bordero,
	) {
		const checkingAccount = await CheckingAccount.find(
			bordero.checking_account_id,
			{
				client: trx,
			},
		);

		await Banking.create(
			{
				economic_group_id: bordero.economic_group_id,
				business_unit_id: bordero.business_unit_id,
				// client_id: bordero.client_id,
				account_plan_id: bordero.account_plan_id,
				payment_method_id: bordero.payment_method_id,
				checking_account_id: bordero.checking_account_id,
				daily_movement_id: bordero.daily_movement_id,
				// daily_cashier_id: bordero.daily_cashier_id,
				// finance_id: bordero.id, // TODO - consertar
				type: bordero.type === "Debito" ? BankingType.D : BankingType.C,
				document: bordero.document,
				historic: bordero.history,
				issueDate: bordero.paymentDate,
				// dataExtratoBancario,
				documentValue: bordero.borderoValue,
				feeValue: bordero.interestValue,
				feePercentage: bordero.interestPercentage,
				discountValue: bordero.discountValue,
				discountPercentage: bordero.discountPercentage,
				totalValue: bordero.totalValue,
				reconciled: true,
				installment: 1,
				originFlag: BankingOriginFlag.BO,
				observation: bordero.observation,
				status: BankingStatus.B,
				balance: (checkingAccount?.balance ?? 0) + bordero.totalValue,
				prevBalance: checkingAccount?.balance,
				competenceDate: bordero.competenceDate,
			},
			{
				client: trx,
			},
		);
	}

	private async $revertRegisterDown(
		trx: TransactionClientContract,
		bordero: Bordero,
		finances: Finance[],
	) {
		await FinanceReversal.create(
			{
				type: FinanceReversalType.E,
				downDate: bordero.downDate,
				reversalOrigin: "Bordero",

				economic_group_id: bordero.economic_group_id,
				business_unit_id: bordero.business_unit_id,
				checking_account_id: bordero.checking_account_id ?? undefined,
				payment_method_id: bordero.payment_method_id,
				banking_id: bordero.bank_statement_id,
				finance_id: bordero.id,
				// account_plan_id:

				feeDiscountPercentage: bordero.discountPercentage,
				feeDiscountValue: bordero.discountValue,
				// expirationDate: bordero.date,
				paymentDate: bordero.paymentDate,
				totalValue: bordero.totalValue,
				paymentValue: bordero.paymentValue,
				feeValue: bordero.interestValue,
				feePercentage: bordero.interestPercentage,
				discountValue: bordero.discountValue,
				discountPercentage: bordero.discountPercentage,
				// additionPercentage: bordero.additionPercentage,
				// additionValue: bordero.additionValue,
				competenceDate: bordero.competenceDate,
			},
			{
				client: trx,
			},
		);

		const tasks = finances.map(async (finance) => {
			return FinanceReversal.create(
				{
					type: FinanceReversalType.E,
					downDate: DateTime.now(),
					reversalOrigin: "Bordero",

					economic_group_id: finance.economic_group_id,
					business_unit_id: finance.business_unit_id,
					finance_id: finance.id,
					client_id: finance.client_id,
					checking_account_id: finance.checking_account_id ?? undefined,
					account_plan_id: finance.account_plan_id,
					payment_method_id: finance.payment_method_id,
					banking_id: finance.banking_id,

					feeDiscountPercentage: finance.feeDiscountPercentage,
					feeDiscountValue: finance.feeDiscountValue,
					expirationDate: finance.expirationDate,
					paymentDate: finance.paymentDate ?? undefined,
					totalValue: finance.totalValue,
					paymentValue: finance.paymentValue ?? undefined,
					feeValue: finance.feeValue,
					feePercentage: finance.feePercentage,
					discountValue: finance.discountValue,
					discountPercentage: finance.discountPercentage,
					additionPercentage: finance.additionPercentage,
					additionValue: finance.additionValue,

					competenceDate: finance.competenceDate,
					fiscalNote: finance.fiscalNote,
					userDocument: finance.userDocument,
					nsuDocument: finance.nsuDocument,
					barCode: finance.barCode,
					bank: finance.bank,
					agency: finance.agency,
					account: finance.account,
					tef_flag_id: finance.tef_flag_id,
					acquirer_id: finance.acquirer_id,
				},
				{
					client: trx,
				},
			);
		});
		await Promise.all(tasks);
	}

	private async $revertRegisterBankingDown(
		trx: TransactionClientContract,
		bordero: Bordero,
	) {
		const checkingAccount = await CheckingAccount.find(
			bordero.checking_account_id,
			{
				client: trx,
			},
		);

		await Banking.create(
			{
				economic_group_id: bordero.economic_group_id,
				business_unit_id: bordero.business_unit_id,
				// client_id: bordero.client_id,
				account_plan_id: bordero.account_plan_id,
				payment_method_id: bordero.payment_method_id,
				checking_account_id: bordero.checking_account_id,
				daily_movement_id: bordero.daily_movement_id,
				// daily_cashier_id: bordero.daily_cashier_id,
				// finance_id: bordero.id, // TODO - consertar
				type: bordero.type === "Debito" ? BankingType.D : BankingType.C,
				document: bordero.document,
				historic: bordero.history,
				issueDate: bordero.paymentDate,
				// dataExtratoBancario,
				documentValue: bordero.borderoValue,
				feeValue: bordero.interestValue,
				feePercentage: bordero.interestPercentage,
				discountValue: bordero.discountValue,
				discountPercentage: bordero.discountPercentage,
				totalValue: bordero.totalValue,
				reconciled: true,
				installment: 1,
				originFlag: BankingOriginFlag.BO,
				observation: bordero.observation,
				status: BankingStatus.B,
				balance: (checkingAccount?.balance ?? 0) + bordero.totalValue,
				prevBalance: checkingAccount?.balance,
				competenceDate: bordero.competenceDate,
			},
			{
				client: trx,
			},
		);
	}

	private parseDecimal(value: string | number) {
		if (!value) return null;

		return parseFloat(value as string);
	}
}
