import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Bill from "App/Models/Bill";
import BillPaymentConference from "App/Models/BillPaymentConference";
import DailyCashier, { DailyCashierStatus } from "App/Models/DailyCashier";
import {
	DailyCashierEntryStatus,
	DailyCashierEntryType,
} from "App/Models/DailyCashierEntry";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import Finance, { FinanceAccept } from "App/Models/Finance";
import SharedService, { AuthContext } from "App/Services/SharedService";
import {
	ICheckCashierData,
	ICloseCashierData,
	ICreateCashierExpenseEntryData,
	ICreateCashierReceiptEntryData,
	IOpenCashierData,
	IReviewCashierData,
} from "Contracts/interfaces/IDailyCashierData";
import { DateTime } from "luxon";

import BillPayment from "../Models/BillPayment";

interface ISearch {
	tag?: string;
	openingUser?: string;
	status?: string;
	complete?: number;
	fromBalance?: string;
	toBalance?: string;
	fromOpening?: string;
	toOpening?: string;
	fromClosing?: string;
	toClosing?: string;
	fromChecking?: string;
	toChecking?: string;
}

@inject()
export default class DailyCashierService {
	constructor(private readonly sharedService: SharedService) {}

	async listSaleItems(authCtx: AuthContext, id: string) {
		const dailyCashier = await DailyCashier.query()
			.where("id", id)
			.where("business_unit_id", authCtx.unit.id)
			.preload("businessUnit")
			.preload("userWhoOpened")
			.preload("userWhoClosed")
			.preload("userWhoChecked")
			.preload("userWhoRevised")
			.preload("entries", (query) => {
				query.preload("paymentMethod");
				query.preload("accountPlan");
			})
			.first();

		if (!dailyCashier) {
			throw this.sharedService.ResourceNotFound("Caixa diário não encontrado");
		}

		const result = await Database.from("bill_payments")
			.select(
				Database.raw(
					`
          bill_payments.bill_id,
          bills.tag,
          patients.name,
          bill_payments.qty_installments,
          payment_methods.description as payment_method,
          tef_flags.description       as flag,
          bill_payments.nsu_document,
          bill_payments.block,
          sum(bill_payments.total_value),
          bill_payments.conference_date
          `,
				),
			)
			.join("bills", (query) => {
				query
					.on("bills.business_unit_id", "=", "bill_payments.business_unit_id")
					.andOn("bills.id", "=", "bill_payments.bill_id");
			})
			.join("patients", (query) => {
				query.on("patients.id", "=", "bills.client_id");
			})
			.join("payment_methods", (query) => {
				query.on("payment_methods.id", "=", "bill_payments.payment_method_id");
			})
			.leftJoin("tef_flags", (query) => {
				query.on("tef_flags.id", "=", "bill_payments.tef_flag_id");
			})
			.where("bill_payments.daily_cashier_id", dailyCashier.id)
			.groupBy(
				"bill_payments.bill_id",
				"bills.tag",
				"patients.name",
				"bill_payments.qty_installments",
				"payment_methods.description",
				"tef_flags.description",
				"bill_payments.nsu_document",
				"bill_payments.block",
				"bill_payments.conference_date",
			);

		return {
			cashier: {
				id: dailyCashier.id,
				unit: {
					id: dailyCashier.businessUnit.id,
					name: dailyCashier.businessUnit.fantasyName,
					company: dailyCashier.businessUnit.companyName,
				},
				tag: dailyCashier.tag,

				opening_user: this.sharedService.captureGroup(
					dailyCashier.userWhoOpened,
					(v) => ({
						id: v.id,
						name: v.name,
					}),
				),
				opening_date: dailyCashier.openingDate,

				closing_user: this.sharedService.captureGroup(
					dailyCashier.userWhoClosed,
					(v) => ({
						id: v.id,
						name: v.name,
					}),
				),
				closing_date: dailyCashier.closingDate,

				checking_user: this.sharedService.captureGroup(
					dailyCashier.userWhoChecked,
					(v) => ({
						id: v.id,
						name: v.name,
					}),
				),
				checking_date: dailyCashier.checkingDate,

				revision_user: this.sharedService.captureGroup(
					dailyCashier.userWhoRevised,
					(v) => ({
						id: v.id,
						name: v.name,
					}),
				),
				revision_date: dailyCashier.revisionDate,

				opening_balance: dailyCashier.openingBalance,
				sales_total: dailyCashier.salesTotal,
				expenses_total: dailyCashier.expensesTotal,
				receipts_total: dailyCashier.receiptsTotal,
				cashier_total: dailyCashier.cashierTotal,

				cashier_funds: dailyCashier.cashierFunds,
				cashier_balance: dailyCashier.cashierBalance,
				observations: dailyCashier.observations,
				status: dailyCashier.status,

				payments: result,
			},
		};
	}

	async dump(authCtx: AuthContext, id: string) {
		return Database.transaction(async (trx) => {
			const result = await DailyCashier.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", id)
				.preload("bills", (query) => {
					query.preload("client", (query) => {
						query.preload("tutor");
					});

					query.preload("payments", (query) => {
						query.preload("acquirer");
						query.preload("flag");
						query.preload("paymentMethod");
					});
				})
				.preload("entries")
				.first();

			if (!result) {
				throw this.sharedService.ResourceNotFound();
			}

			const payments = await BillPayment.query()
				.useTransaction(trx)
				.where("daily_cashier_id", id)
				.preload("acquirer")
				.preload("flag")
				.preload("paymentMethod")
				.preload("bill", (query) => {
					query.preload("client");
				});

			const billMap: Record<string, BillPayment> = {};
			payments.forEach((p) => {
				const key = `${p.bill_id}-${p.block}`;

				const existing = billMap[key];
				if (!existing) {
					billMap[key] = p;
					return;
				}

				if (existing && existing.installments < p.installments) {
					billMap[key] = p;
				}
			});

			return {
				id: result.id,
				tag: result.tag,
				daily_movement_id: result.daily_movement_id,
				user_who_opened_id: result.user_who_opened_id,
				opening_date: result.openingDate,
				user_who_closed_id: result.user_who_closed_id,
				closing_date: result.closingDate,
				user_who_revised_id: result.user_who_revised_id,
				revision_date: result.revisionDate,
				user_who_checked_id: result.user_who_checked_id,
				checking_date: result.checkingDate,
				opening_balance: parseFloat(result.openingBalance as unknown as string),
				cashier_funds: parseFloat(result.cashierFunds as unknown as string),
				sales_total: parseFloat(result.salesTotal as unknown as string),
				expenses_total: parseFloat(result.expensesTotal as unknown as string),
				receipts_total: parseFloat(result.receiptsTotal as unknown as string),
				cashier_total: parseFloat(result.cashierTotal as unknown as string),
				cashier_balance: parseFloat(result.cashierBalance as unknown as string),
				observation: result.observations,
				status: result.status,
				despesas: result.entries
					.filter(
						(e) =>
							e.type === DailyCashierEntryType.D &&
							e.status === DailyCashierEntryStatus.A,
					)
					.map((e) => ({
						tag: e.tag,
						entry_date: e.entryDate,
						description: e.description,
						value: parseFloat(e.value as unknown as string),
					})),
				recebimentos: result.entries
					.filter(
						(e) =>
							e.type === DailyCashierEntryType.C &&
							e.status === DailyCashierEntryStatus.A,
					)
					.map((e) => ({
						tag: e.tag,
						entry_date: e.entryDate,
						description: e.description,
						value: parseFloat(e.value as unknown as string),
					})),
				bill_payments: Object.values(billMap).map((e) => ({
					id: e.id,
					block: e.block,
					bill: {
						id: e.bill?.id,
					},
					payment_method: {
						id: e.paymentMethod.id,
						description: e.paymentMethod.description,
						fee: e.paymentMethod.fee,
					},
					client: {
						id: e.bill?.client.id,
						name: e.bill?.client.name,
						email: e.bill?.client?.tutor?.email ?? null,
					},
					payment_description: {
						bill_tag: e.bill?.tag,
						tef_flag_id: e.tef_flag_id,
						tef_flag_description: e.flag?.description,
						tef_aquirer_id: e.tef_acquirer_id,
						tef_aquirer_description: e.acquirer?.description,
						expiration_date: e.expirationDate,
						installments: e.installments,
						installment_value: e.installmentValue,
						total_value: e.installmentValue * e.installments,
						nsu_document: e.nsuDocument,
					},
				})),
			};
		});
	}

	async index(authCtx: AuthContext, data: ISearch) {
		const query = DailyCashier.query()
			.orderByRaw("opening_date desc")
			.where("business_unit_id", authCtx.unit.id)
			.preload("userWhoOpened")
			.preload("userWhoClosed")
			.preload("userWhoRevised")
			.preload("userWhoChecked")
			.preload("entries");

		if (data.tag) {
			query.where("tag", data.tag);
		} else {
			if (data.openingUser) {
				query.where("user_who_opened_id", data.openingUser);
			}
			if (data.fromBalance) {
				query.where(
					"cashier_balance",
					">=",
					Number.parseFloat(data.fromBalance),
				);
			}

			if (data.toBalance) {
				query.where("cashier_balance", "<=", Number.parseFloat(data.toBalance));
			}

			if (!data.tag && data.status) {
				if (data.status !== "TODOS") {
					query.where("status", data.status as string);
				}
			}

			if (data.fromOpening && data.toOpening) {
				query.whereRaw("opening_date::date between ? and ?", [
					data.fromOpening,
					data.toOpening,
				]);
			}

			if (data.fromClosing && data.toClosing) {
				query.whereRaw("closing_date::date between ? and ?", [
					data.fromClosing,
					data.toClosing,
				]);
			}

			if (data.fromChecking && data.toChecking) {
				query.whereRaw("checking_date::date between ? and ?", [
					data.fromChecking,
					data.toChecking,
				]);
			}
		}

		return query;
	}

	async openDailyCashier(authCtx: AuthContext, data: IOpenCashierData) {
		return Database.transaction(async (trx) => {
			if (authCtx.unit.unitConfig.dailyCashierType === "usuario") {
				const anotherOpenCashiers = await DailyCashier.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("user_who_opened_id", data.userId ?? authCtx.user.id)
					.whereRaw(`(status = ? or opening_date::date = now()::date)`, [
						DailyCashierStatus.A,
					])
					.orderBy("opening_date", "desc");

				if (
					anotherOpenCashiers.some((c) => c.status === DailyCashierStatus.A)
				) {
					throw new BadRequestException(
						"Já existe um caixa diário aberto para este usuário",
						400,
						"E_DAILY_CASHIER_ALREADY_OPENED",
					);
				}

				if (anotherOpenCashiers.length > 0) {
					throw new BadRequestException(
						"Já existe um caixa diário hoje para este usuário",
						400,
						"E_DAILY_CASHIER_ALREADY_OPENED",
					);
				}
			}

			if (authCtx.unit.unitConfig.dailyCashierType === "geral") {
				const anotherOpenCashiers = await DailyCashier.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyCashierStatus.A)
					.first();

				if (anotherOpenCashiers) {
					throw new BadRequestException(
						"Já existe um caixa diário aberto para esta unidade",
						400,
						"E_DAILY_CASHIER_ALREADY_OPENED",
					);
				}
			}

			if (authCtx.unit.unitConfig.lockedDailyMovementDate) {
				const anotherOpenDailyMovement = await DailyMovement.query()
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyMovementStatus.A)
					.whereRaw(`(opening_date::date = now()::date)`)
					.first();

				if (!anotherOpenDailyMovement) {
					throw new BadRequestException(
						"Não existe movimento diário aberto para a data de hoje",
						400,
						"E_DAILY_MOVEMENT_OPENED",
					);
				}
			} else {
				const anotherOpenDailyMovement = await DailyMovement.query()
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyMovementStatus.A)
					.first();

				if (!anotherOpenDailyMovement) {
					throw new BadRequestException(
						"Não existe movimento diário aberto",
						400,
						"E_DAILY_MOVEMENT_OPENED",
					);
				}
			}

			const dailyMovement = await DailyMovement.findOrFail(
				data.dailyMovementId,
				{
					client: trx,
				},
			);

			if (dailyMovement.status !== DailyMovementStatus.A) {
				throw new BadRequestException(
					"Movimento diário não está aberto",
					400,
					"E_DAILY_MOVEMENT_NOT_OPENED",
				);
			}

			const existingCashier = await dailyMovement
				.related("cashiers")
				.query()
				.useTransaction(trx)
				.where("user_who_opened_id", data.userId ?? authCtx.user.id)
				.where("status", DailyCashierStatus.A)
				.first();

			if (existingCashier) {
				throw new BadRequestException(
					"Caixa já está aberto para este usuário",
					400,
					"E_DAILY_CASHIER_ALREADY_OPENED",
				);
			}

			const count = await DailyCashier.query()
				.where("business_unit_id", authCtx.unit.id)
				.select(["id"]);

			return dailyMovement.related("cashiers").create({
				business_unit_id: authCtx.unit.id,
				user_who_opened_id: data.userId ?? authCtx.user.id,
				openingDate: data.openingDate,
				status: DailyCashierStatus.A,
				tag: count.length + 1,
				openingBalance: data.initialBalance,
			});
		});
	}

	async closeDailyCashier(
		authCtx: AuthContext,
		id: string,
		data: ICloseCashierData,
	) {
		const dailyCashier = await DailyCashier.query()
			.where("id", id)
			.where("business_unit_id", authCtx.unit.id)
			.first();

		if (!dailyCashier) {
			throw this.sharedService.ResourceNotFound("Caixa diário não encontrado");
		}

		if (dailyCashier.status !== DailyCashierStatus.A) {
			throw new BadRequestException(
				"Caixa diário não está aberto",
				400,
				"E_DAILY_CASHIER_NOT_OPENED",
			);
		}

		const entries = await dailyCashier.related("entries").query();

		const payments = await BillPayment.query().where("daily_cashier_id", id);

		const salesSum = payments.reduce(
			(total, payment) => total + payment.totalValue,
			0,
		);

		const expensesTotal = entries
			.filter((entry) => entry.type === DailyCashierEntryType.D)
			.reduce(
				(total, entry) => total + parseFloat(entry.value as unknown as string),
				0,
			);
		const receiptsTotal = entries
			.filter((entry) => entry.type === DailyCashierEntryType.C)
			.reduce(
				(total, entry) => total + parseFloat(entry.value as unknown as string),
				0,
			);

		const partial =
			parseFloat(dailyCashier.openingBalance as unknown as string) +
			salesSum +
			receiptsTotal -
			expensesTotal;

		return dailyCashier
			.merge({
				status: DailyCashierStatus.F,
				closingDate: data.closingDate,
				user_who_closed_id: data.userId,
				salesTotal: salesSum,
				expensesTotal,
				receiptsTotal,
				cashierTotal: data.cashierTotal,
				cashierBalance: data.cashierTotal - partial,
				observations: data.observations,
			})
			.save();
	}

	async reopenDailyCashier(authCtx: AuthContext, id: string) {
		return await Database.transaction(async (trx) => {
			const dailyCashier = await DailyCashier.query()
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!dailyCashier) {
				throw this.sharedService.ResourceNotFound(
					"Caixa diário não encontrado",
				);
			}

			if (
				![DailyCashierStatus.F, DailyCashierStatus.R].includes(
					dailyCashier.status,
				)
			) {
				throw new BadRequestException(
					"Caixa diário não está fechado",
					400,
					"E_DAILY_CASHIER_NOT_CLOSED",
				);
			}

			const unitDailyMovement = await DailyMovement.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("status", DailyMovementStatus.A)
				.first();

			if (!unitDailyMovement) {
				throw new BadRequestException(
					"Nenhum movimento diário aberto para a unidade",
					400,
					"E_DAILY_MOVEMENT_NOT_OPENED",
				);
			}

			if (dailyCashier.daily_movement_id !== unitDailyMovement.id) {
				throw new BadRequestException(
					"Caixa diário não pertence ao movimento diário aberto para a unidade",
					400,
					"E_DAILY_CASHIER_NOT_OPENED",
				);
			}

			if (authCtx.unit.unitConfig.dailyCashierType === "usuario") {
				const anotherOpenCashiers = await DailyCashier.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("user_who_opened_id", authCtx.user.id)
					.whereRaw(`(status = ?)`, [DailyCashierStatus.A])
					.orderBy("opening_date", "desc");

				if (anotherOpenCashiers.length > 0) {
					throw new BadRequestException(
						"Já existe um caixa diário hoje para este usuário",
						400,
						"E_DAILY_CASHIER_ALREADY_OPENED",
					);
				}
			}

			if (authCtx.unit.unitConfig.dailyCashierType === "geral") {
				const anotherOpenCashiers = await DailyCashier.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyCashierStatus.A);

				if (anotherOpenCashiers.length > 0) {
					throw new BadRequestException(
						"Já existe um caixa diário aberto para esta unidade",
						400,
						"E_DAILY_CASHIER_ALREADY_OPENED",
					);
				}
			}

			await dailyCashier.related("logs").create(
				{
					business_unit_id: authCtx.unit.id,
					user_who_closed_id: dailyCashier.user_who_closed_id,
					user_who_reopened_id: authCtx.user.id,
					openingBalance: dailyCashier.openingBalance,
					cashierFunds: dailyCashier.cashierFunds,
					salesTotal: dailyCashier.salesTotal,
					receiptsTotal: dailyCashier.receiptsTotal,
					cashierTotal: dailyCashier.cashierTotal,
					cashierBalance: dailyCashier.cashierBalance,
					observations: dailyCashier.observations,
					tag: dailyCashier.tag,
				},
				{
					client: trx,
				},
			);

			return dailyCashier
				.merge({
					status: DailyCashierStatus.A,
					salesTotal: 0,
					expensesTotal: 0,
					receiptsTotal: 0,
					cashierTotal: 0,
					cashierBalance: 0,
					closingDate: null,
					user_who_closed_id: null,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async checkDailyCashier(
		authCtx: AuthContext,
		id: string,
		data: ICheckCashierData,
	) {
		return Database.transaction(async (trx) => {
			const dailyCashier = await DailyCashier.query()
				.useTransaction(trx)
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!dailyCashier) {
				throw this.sharedService.ResourceNotFound(
					"Caixa diário não encontrado",
				);
			}

			if (dailyCashier.status !== DailyCashierStatus.F) {
				throw new BadRequestException(
					"Caixa diário não está fechado",
					400,
					"E_DAILY_CASHIER_NOT_CLOSED",
				);
			}

			return dailyCashier
				.merge({
					user_who_checked_id: authCtx.user.id,

					status: DailyCashierStatus.C,
					observations: [dailyCashier.observations, data.observations].join(
						" - ",
					),
					checkingDate: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async reviewDailyCashier(
		authCtx: AuthContext,
		id: string,
		data: IReviewCashierData,
	) {
		return Database.transaction(async (trx) => {
			const dailyCashier = await DailyCashier.query()
				.useTransaction(trx)
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!dailyCashier) {
				throw this.sharedService.ResourceNotFound(
					"Caixa diário não encontrado",
				);
			}

			if (dailyCashier.status !== DailyCashierStatus.F) {
				throw new BadRequestException(
					"Caixa diário não está fechado",
					400,
					"E_DAILY_CASHIER_NOT_CLOSED",
				);
			}

			return dailyCashier
				.merge({
					user_who_revised_id: data.userId,
					status: DailyCashierStatus.R,
					revisionDate: data.revisionDate,
					observations: [dailyCashier.observations, data.observations].join(
						" - ",
					),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async createCashierExpenseEntry(
		authCtx: AuthContext,
		id: string,
		data: ICreateCashierExpenseEntryData,
	) {
		const dailyCashier = await DailyCashier.query()
			.where("id", id)
			.where("business_unit_id", authCtx.unit.id)
			.first();

		if (!dailyCashier) {
			throw this.sharedService.ResourceNotFound("Caixa diário não encontrado");
		}

		if (dailyCashier.status !== DailyCashierStatus.A) {
			throw new BadRequestException(
				"Caixa diário não está aberto",
				400,
				"E_DAILY_CASHIER_NOT_OPENED",
			);
		}

		await dailyCashier.related("entries").create({
			business_unit_id: authCtx.unit.id,
			account_plan_id: data.accountPlanId,
			payment_method_id: data.paymentMethodId,

			type: DailyCashierEntryType.D,
			description: data.description,
			value: data.value,
			status: DailyCashierEntryStatus.A,
			entryDate: data.entryDate,
			tag: dailyCashier.tag,
			fiscalNote: data.fiscalNote,
		});
	}

	async createCashierReceiptEntry(
		authCtx: AuthContext,
		id: string,
		data: ICreateCashierReceiptEntryData,
	) {
		const dailyCashier = await DailyCashier.query()
			.where("id", id)
			.where("business_unit_id", authCtx.unit.id)
			.first();

		if (!dailyCashier) {
			throw this.sharedService.ResourceNotFound("Caixa diário não encontrado");
		}

		if (dailyCashier.status !== DailyCashierStatus.A) {
			throw new BadRequestException(
				"Caixa diário não está aberto",
				400,
				"E_DAILY_CASHIER_NOT_OPENED",
			);
		}

		await dailyCashier.related("entries").create({
			business_unit_id: authCtx.unit.id,
			account_plan_id: data.accountPlanId,
			payment_method_id: data.paymentMethodId,

			type: DailyCashierEntryType.C,
			description: data.description,
			value: data.value,
			status: DailyCashierEntryStatus.A,
			entryDate: data.entryDate,
			tag: dailyCashier.tag,
			fiscalNote: data.fiscalNote,
		});
	}

	async updateCashierPaymentsConference(
		authCtx: AuthContext,
		data: {
			dailyCashierId: string;
			items: { billId: string; block: number; conference: boolean }[];
		},
	) {
		await Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((b) => b.billId),
				)
				.where("business_unit_id", authCtx.unit.id)
				.preload("payments", (query) => {
					query.where("daily_cashier_id", data.dailyCashierId);
				})
				.first();

			if (!bill) {
				throw this.sharedService.ResourceNotFound(
					"Nota de saída não encontrada",
				);
			}

			const uniqueBills = Array.from(new Set(data.items.map((b) => b.billId)));

			const tasks = uniqueBills.map(async (billId) => {
				const items = data.items.filter((b) => b.billId === billId);

				const truthyOnes = items.filter((b) => b.conference);
				const falsyOnes = items.filter((b) => !b.conference);

				const bps = await BillPayment.query()
					.useTransaction(trx)
					.where("bill_id", billId)
					.whereIn(
						"block",
						truthyOnes.map((b) => b.block),
					);

				await BillPayment.query()
					.useTransaction(trx)
					.where("bill_id", billId)
					.whereIn(
						"block",
						truthyOnes.map((b) => b.block),
					)
					.update({
						conferenceDate: DateTime.now(),
						user_id: authCtx.user.id,
					});

				await Finance.query()
					.useTransaction(trx)
					.whereIn(
						"origin_id",
						bps.map((p) => p.id),
					)
					.update({
						accept: FinanceAccept.S,
						acceptedDate: DateTime.now(),
					});

				const falsyBlocks = falsyOnes.map((b) => b.block);
				await BillPayment.query()
					.useTransaction(trx)
					.where("bill_id", billId)
					.whereIn("block", falsyBlocks)
					.update({
						conferenceDate: null,
						user_id: null,
					});

				await BillPaymentConference.createMany(
					bill.payments
						.filter((p) => falsyBlocks.includes(p.block))
						.map((elem) => ({
							issueDate: DateTime.now(),
							issue_user_id: authCtx.user.id,

							conferenceDate: elem.conferenceDate,
							conference_user_id: elem.user_id,
						})),
					{ client: trx },
				);
			});

			await Promise.all(tasks);
		});
	}
}
