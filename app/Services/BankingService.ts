import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import Banking, { BankingStatus, BankingType } from "App/Models/Banking";
import CheckingAccount from "App/Models/CheckingAccount";
import DailyCashier from "App/Models/DailyCashier";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import Finance, {
	FinanceAccept,
	FinanceOriginDownFlag,
	FinanceOriginFlag,
	FinanceStatus,
	FinanceType,
} from "App/Models/Finance";
import PaymentMethod from "App/Models/PaymentMethod";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { IUpsertBankingData } from "Contracts/interfaces/IBankingData";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { validate } from "uuid";

interface ISearch {
	type?: string;
	reconciled?: string;
	account?: string;
	competence?: string;
	document?: string;

	from?: string;
	to?: string;
}

@inject()
export default class BankingService {
	constructor(private sharedService: SharedService) {}

	async index(unitId: string, data: ISearch) {
		const qb = Banking.query()
			.orderBy("issue_date", "asc")
			.orderBy("created_at", "asc")
			.where("business_unit_id", unitId);

		if (data.type) {
			qb.where("type", data.type);
		}

		if (data.reconciled) {
			qb.where("reconciled", data.reconciled === "true");
		}

		if (data.account) {
			qb.where("checking_account_id", data.account);
		}

		if (data.competence) {
			qb.where("competence_date", data.competence);
		}

		if (data.document) {
			qb.whereILike("document", `%${data.document}%`);
		}

		if (data.from) {
			qb.where("issue_date", ">=", data.from);
		}

		if (data.to) {
			qb.where("issue_date", "<=", data.to);
		}

		qb.preload("checkingAccount")
			.preload("paymentMethod")
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("accountPlan");
				});
			})
			.preload("accountPlan")
			.preload("tefFlag", (query) => {
				query.select(["id", "description"]);
			})
			.preload("acquirer", (query) => {
				query.select(["id", "description"]);
			});

		return qb;
	}

	async storeBanking(authCtx: AuthContext, data: IUpsertBankingData) {
		return Database.transaction(async (trx) => {
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

			const fromCheckingAccount = await CheckingAccount.findOrFail(
				data.fromCheckingAccountId,
				{
					client: trx,
				},
			);

			const toCheckingAccount = await CheckingAccount.findOrFail(
				data.toCheckingAccountId,
				{
					client: trx,
				},
			);

			const discount = data.documentValue * (paymentMethod.fee / 100);

			const total =
				data.documentValue +
				(data.feeValue || 0) -
				(data.discountValue || 0) -
				discount;

			const finance = await Finance.create(
				{
					user_id: authCtx.user.id,
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_id: data.clientId,
					type: data.type === BankingType.C ? FinanceType.C : FinanceType.D,
					account_plan_id: data.fromAccountPlanId,
					payment_method_id: data.paymentMethodId,
					checking_account_id: data.fromCheckingAccountId,
					daily_movement_id: dailyMovement?.id,
					daily_cashier_id: dailyCashier?.id,

					document: data.document,
					historic: data.historic,
					issueDate: data.issueDate.plus({ hours: 3 }),
					expirationDate: data.issueDate,
					paymentDate: data.issueDate,
					originalValue: data.documentValue,
					value: data.documentValue,
					totalValue: total,
					accept: FinanceAccept.S,
					installment:
						typeof data.installment !== "undefined" ? data.installment : 1,
					originFlag: FinanceOriginFlag.F,
					originDownFlag: FinanceOriginDownFlag.F,
					downDate: data.issueDate,
					paymentValue: total,
					feeValue: data.feeValue,
					feePercentage: data.feePercentage,
					discountValue: data.discountValue,
					discountPercentage: data.discountPercentage,
					additionValue: 0,
					additionPercentage: 0,
					status: FinanceStatus.B,
					feeDiscountPercentage: paymentMethod.fee,
					feeDiscountValue: discount,
					observation: data.observation,
					competenceDate: data.competenceDate,
					fiscalNote: data.fiscalNote,
					userDocument: data.userDocument,
					nsuDocument: data.nsuDocument,
					barCode: data.barCode,
					qtyInstallments: 1,
				},
				{
					client: trx,
				},
			);

			const finance2 = await Finance.create(
				{
					user_id: authCtx.user.id,
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_id: data.clientId,
					type: data.type === BankingType.C ? FinanceType.D : FinanceType.C,
					account_plan_id: data.toAccountPlanId,
					payment_method_id: data.paymentMethodId,
					checking_account_id: data.toCheckingAccountId,
					daily_movement_id: dailyMovement?.id,
					daily_cashier_id: dailyCashier?.id,
					origin_id: finance.id,

					document: data.document,
					historic: data.historic,
					issueDate: data.issueDate.plus({ hours: 3 }),
					expirationDate: data.issueDate,
					paymentDate: data.issueDate,
					originalValue: data.documentValue,
					value: data.documentValue,
					totalValue: total,
					accept: FinanceAccept.S,
					installment:
						typeof data.installment !== "undefined" ? data.installment : 1,
					originFlag: FinanceOriginFlag.F,
					originDownFlag: FinanceOriginDownFlag.F,
					downDate: data.issueDate,
					paymentValue: total,
					feeValue: data.feeValue,
					feePercentage: data.feePercentage,
					discountValue: data.discountValue,
					discountPercentage: data.discountPercentage,
					additionValue: 0,
					additionPercentage: 0,
					status: FinanceStatus.B,
					feeDiscountPercentage: paymentMethod.fee,
					feeDiscountValue: discount,
					observation: data.observation,
					competenceDate: data.competenceDate,
					fiscalNote: data.fiscalNote,
					userDocument: data.userDocument,
					nsuDocument: data.nsuDocument,
					barCode: data.barCode,
					qtyInstallments: 1,
				},
				{
					client: trx,
				},
			);

			await finance
				.merge({
					origin_id: finance2.id,
				})
				.useTransaction(trx)
				.save();

			// const existingBankingsBefore = await Banking.query()
			// 	.where("economic_group_id", authCtx.group.id)
			// 	.whereRaw("issue_date::date <= ?", [data.issueDate.toJSDate()])
			// 	.where("checking_account_id", data.checkingAccountId)
			// 	.limit(1)
			// 	.orderBy("issue_date", "desc");
			// const prevBalance = existingBankingsBefore.at(0)?.balance ?? 0;
			//
			// await Database.rawQuery(
			// 	`update bankings set prev_balance = prev_balance ${
			// 		data.type === BankingType.C ? `+ ${total}` : `- ${total}`
			// 	}, balance = balance ${
			// 		data.type === BankingType.C ? `+ ${total}` : `- ${total}`
			// 	} where checking_account_id = :id and issue_date::date > ${`'${data.issueDate}'::date`}`,
			// 	{
			// 		id: data.checkingAccountId,
			// 	},
			// ).useTransaction(trx);

			// const existingBankingsAfter = await Banking.query()
			//   .where('economic_group_id', group.id)
			//   .whereRaw('issue_date::date > ?', [data.issueDate.toJSDate()])
			//   .orderBy('created_at', 'asc');

			// if (existingBankingsAfter.length > 0) {
			//   const promises = existingBankingsAfter.map(eb => {
			//     const newPrevBalance =
			//       eb.type === BankingType.C
			//         ? eb.prevBalance + total
			//         : eb.prevBalance - total;
			//     const sum =
			//       eb.type === BankingType.C
			//         ? newPrevBalance + total
			//         : newPrevBalance - total;

			//     return eb
			//       .merge({
			//         prevBalance: newPrevBalance,
			//         balance: sum,
			//       })
			//       .useTransaction(trx)
			//       .save();
			//   });

			//   await Promise.all(promises);
			// }

			// const banking = await Banking.create(
			// 	{
			// 		economic_group_id: authCtx.group.id,
			// 		business_unit_id: authCtx.unit.id,
			// 		client_id: data.clientId,
			// 		account_plan_id: data.accountPlanId,
			// 		payment_method_id: data.paymentMethodId,
			// 		checking_account_id: data.checkingAccountId,
			// 		daily_movement_id: dailyMovement?.id,
			// 		daily_cashier_id: dailyCashier?.id,
			// 		finance_id: finance.id,
			// 		tef_flag_id: data.tefFlagId,
			// 		acquirer_id: data.acquirerId,
			//
			// 		type: data.type,
			// 		document: data.document,
			// 		historic: data.historic,
			// 		issueDate: data.issueDate,
			// 		documentValue: data.documentValue,
			// 		feeValue: data.feeValue,
			// 		feePercentage: data.feePercentage,
			// 		discountValue: data.discountValue,
			// 		discountPercentage: data.discountPercentage,
			// 		reconciled: data.reconciled,
			// 		installment: data.installment,
			// 		originFlag: data.originFlag,
			//
			// 		observation: data.observation,
			//
			// 		totalValue: total,
			// 		status: BankingStatus.B,
			// 		prevBalance,
			// 		balance:
			// 			data.type === BankingType.C
			// 				? prevBalance + total
			// 				: prevBalance - total,
			// 		paymentMethodDiscountPercentage: paymentMethod.fee,
			// 		paymentMethodDiscountValue: discount,
			// 		competenceDate: data.competenceDate,
			// 		fiscalNote: data.fiscalNote,
			// 		userDocument: data.userDocument,
			// 		nsuDocument: data.nsuDocument,
			// 		barCode: data.barCode,
			// 	},
			// 	{
			// 		client: trx,
			// 	},
			// );

			// await finance
			// 	.merge({
			// 		banking_id: banking.id,
			// 	})
			// 	.useTransaction(trx)
			// 	.save();

			await fromCheckingAccount
				.merge({
					balance:
						data.type === BankingType.C
							? fromCheckingAccount.balance + total
							: fromCheckingAccount.balance - total,
				})
				.useTransaction(trx)
				.save();

			await toCheckingAccount
				.merge({
					balance:
						data.type === BankingType.C
							? toCheckingAccount.balance - total
							: toCheckingAccount.balance + total,
				})
				.useTransaction(trx)
				.save();

			return finance;
		});
	}

	async updateBanking(
		unitId: string,
		user: User,
		id: string,
		data: IUpsertBankingData,
	) {
		const banking = await Banking.query()
			.where("id", id)
			.where("business_unit_id", unitId)
			.first();
		if (!banking) {
			throw this.sharedService.ResourceNotFound();
		}

		const paymentMethod = await PaymentMethod.findOrFail(data.paymentMethodId);
		const dailyMovement = await DailyMovement.query()
			.where("business_unit_id", unitId)
			.where("status", DailyMovementStatus.A)
			.first();
		const dailyCashier = await DailyCashier.query()
			.where("business_unit_id", unitId)
			.where("status", DailyMovementStatus.A)
			.where("user_who_opened_id", user.id)
			.first();
		const checkingAccount = await CheckingAccount.findOrFail(
			data.checkingAccountId,
		);

		const discount = data.documentValue * (paymentMethod.fee / 100);

		const total =
			data.documentValue +
			(data.feeValue || 0) -
			(data.discountValue || 0) -
			discount;
		const prevBalance = checkingAccount.balance;

		banking
			.merge({
				client_id: data.clientId,
				account_plan_id: data.fromAccountPlanId,
				payment_method_id: data.paymentMethodId,
				checking_account_id: data.checkingAccountId,
				daily_movement_id: dailyMovement?.id,
				daily_cashier_id: dailyCashier?.id,
				tef_flag_id: data.tefFlagId,
				acquirer_id: data.acquirerId,

				type: data.type,
				document: data.document,
				historic: data.historic,
				issueDate: data.issueDate,
				documentValue: data.documentValue,
				feeValue: data.feeValue,
				feePercentage: data.feePercentage,
				discountValue: data.discountValue,
				discountPercentage: data.discountPercentage,
				reconciled: data.reconciled,
				installment:
					typeof data.installment !== "undefined" ? data.installment : 1,
				originFlag: data.originFlag,

				observation: data.observation,
				competenceDate: data.competenceDate,
				fiscalNote: data.fiscalNote,
				userDocument: data.userDocument,
				nsuDocument: data.nsuDocument,
				barCode: data.barCode,

				totalValue: total,
				status: BankingStatus.B,
				prevBalance,
				balance:
					data.type === BankingType.C
						? prevBalance + total
						: prevBalance - total,
				paymentMethodDiscountPercentage: paymentMethod.fee,
				paymentMethodDiscountValue: discount,
			})
			.save();

		return banking;
	}

	public async deleteBanking(authCtx: AuthContext, bankingID: string) {
		if (!validate(bankingID)) {
			throw new BadRequestException("Identificador inválido", 400, "E_ERR");
		}

		await Database.transaction(async (trx) => {
			// if (!authCtx.hasPermission("BAN03")) {
			// 	throw new UnauthorizedException(
			// 		"Usuário não possui permissão para excluir um titulo bancário",
			// 		401,
			// 		"E_ERR",
			// 	);
			// }

			const banking = await Banking.query()
				.useTransaction(trx)
				.where("id", bankingID)
				.first();
			if (!banking) {
				throw new BadRequestException("Registro não encontrado", 401, "E_ERR");
			}

			await banking
				.merge({
					deletedAt: DateTime.now(),
					user_exclusion_id: authCtx.user.id,
				})
				.useTransaction(trx)
				.save();

			await Finance.query()
				.useTransaction(trx)
				.where("origin_id", banking.id)
				.where("origin_flag", "BANCARIO")
				.update({
					deletedAt: DateTime.now(),
					exclusion_user_id: authCtx.user.id,
				});

			if (banking.checking_account_id) {
				const checkingAccounts = await CheckingAccount.query()
					.useTransaction(trx)
					.where("id", banking.checking_account_id);
				const checkingTasks = checkingAccounts.map((ca) =>
					ca
						.merge({
							balance:
								banking.type === BankingType.C
									? new Decimal(ca.balance).minus(banking.totalValue).toNumber()
									: new Decimal(ca.balance).plus(banking.totalValue).toNumber(),
						})
						.useTransaction(trx)
						.save(),
				);
				await Promise.all(checkingTasks);
			}

			await Database.rawQuery(
				`update bankings set balance = bankings.balance + case when excluido.type = 'CREDITO' then excluido.total_value * (-1) else excluido.total_value end
from bankings as excluido
where bankings.checking_account_id = excluido.checking_account_id
  and bankings.issue_date::date = excluido.issue_date::date
  and bankings.created_at > excluido.created_at
  and excluido.id = ?`,
				[banking.id],
			).useTransaction(trx);
		});
	}
}
