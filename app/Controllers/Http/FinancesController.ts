import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import FinanceService from "App/Services/FinanceService";
import SharedService from "App/Services/SharedService";
import AcceptManyFinanceValidator from "App/Validators/Finance/AcceptManyFinanceValidator";
import CalculateFinanceFeeValidator from "App/Validators/Finance/CalculateFinanceFeeValidator";
import CreateBorderoItemValidator from "App/Validators/Finance/CreateBorderoItemValidator";
import CreateBorderoValidator from "App/Validators/Finance/CreateBorderoValidator";
import CreateMultipleFinancesValidator from "App/Validators/Finance/CreateMultipleFinancesValidator";
import DownBorderoValidator from "App/Validators/Finance/DownBorderoValidator";
import ExcludeBorderoItemValidator from "App/Validators/Finance/ExcludeBorderoItemValidator";
import MutateBorderoValidator from "App/Validators/Finance/MutateBorderoValidator";
import RevertDownBorderoValidator from "App/Validators/Finance/RevertDownBorderoValidator";
import UpdateBorderoValidator from "App/Validators/Finance/UpdateBorderoValidator";
import UpdateFinanceDownValidator from "App/Validators/Finance/UpdateFinanceDownValidator";
import UpdateFinanceReversalValidator from "App/Validators/Finance/UpdateFinanceReversalValidator";
import UpdateFinanceValidator from "App/Validators/Finance/UpdateFinanceValidator";
import UpdateGroupedFinanceDownValidator from "App/Validators/Finance/UpdateGroupedFinanceDownValidator";
import UpsertFinanceValidator from "App/Validators/Finance/UpsertFinanceValidator";

@inject()
export default class FinancesController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly service: FinanceService,
	) {}

	async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.index(unit_id, {
			fromIssueDate: qs.fromIssue,
			toIssueDate: qs.toIssue,

			fromExpirationDate: qs.fromExpiration,
			toExpirationDate: qs.toExpiration,

			fromPaymentDate: qs.fromPayment,
			toPaymentDate: qs.toPayment,

			ids: qs.ids,
			client: qs.client,
			document: qs.document,
			fiscalNote: qs.fiscalNote,
			paymentMethod: qs.paymentMethod,
			nsu: qs.nsu,
			status: qs.status,
			accept: qs.accept,
			reconciled: qs.reconciled,
			type: qs.type,
			unit: qs.unit,
			plan: qs.plan,
			competence: qs.competence,
		});

		return response.ok(result);
	}

	async reducedIndex({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.reducedIndex(unit_id, {
			fromIssueDate: qs.fromIssue,
			toIssueDate: qs.toIssue,

			fromExpirationDate: qs.fromExpiration,
			toExpirationDate: qs.toExpiration,

			fromPaymentDate: qs.fromPayment,
			toPaymentDate: qs.toPayment,

			ids: qs.ids,
			client: qs.client,
			document: qs.document,
			fiscalNote: qs.fiscalNote,
			paymentMethod: qs.paymentMethod,
			nsu: qs.nsu,
			status: qs.status,
			accept: qs.accept,
			reconciled: qs.reconciled,
			type: qs.type,
			unit: qs.unit,
			plan: qs.plan,
			competence: qs.competence,

			groupBorderos: qs.groupBorderos,
		});

		return response.ok(result);
	}

	async groupedIndex({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const result = await this.service.groupedIndex(
			await this.sharedService.getAuthContext(auth),
			{
				fromIssueDate: qs.fromIssue,
				toIssueDate: qs.toIssue,

				fromExpirationDate: qs.fromExpiration,
				toExpirationDate: qs.toExpiration,

				fromPaymentDate: qs.fromPayment,
				toPaymentDate: qs.toPayment,

				ids: qs.ids,
				client: qs.client,
				document: qs.document,
				fiscalNote: qs.fiscalNote,
				paymentMethod: qs.paymentMethod,
				nsu: qs.nsu,
				status: qs.status,
				accept: qs.accept,
				reconciled: qs.reconciled,
				type: qs.type,
				unit: qs.unit,
				plan: qs.plan,
				competence: qs.competence,

				groupBorderos: qs.groupBorderos,
			},
		);

		return response.ok(result);
	}

	async byPaymentGroup({ auth, request, response }: HttpContextContract) {
		const result = await this.service.financesByPaymentGroup(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	// async show({ params, auth, response }: HttpContextContract) {
	//   const result = await this.service.show(
	//     await this.sharedService.getAuthContext(auth),
	//     params.id,
	//   );

	//   return response.ok(result);
	// }

	async storeFinance({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpsertFinanceValidator);

		const result = await this.service.createFinance(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	async showBordero({ request, params, auth, response }: HttpContextContract) {
		const result = await this.service.showBordero(
			await this.sharedService.getAuthContext(auth),
			params.id,
			request.qs(),
		);

		return response.ok(result);
	}

	async storeBordero({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateBorderoValidator);

		await this.service.createBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created();
	}

	async storeBorderoItems({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateBorderoItemValidator);

		await this.service.createBorderoItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created();
	}

	async closeBordero({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(MutateBorderoValidator);

		await this.service.closeBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async reopenBordero({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(MutateBorderoValidator);

		await this.service.reopenBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async updateBordero({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateBorderoValidator);

		await this.service.updateBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async excludeBordero({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(MutateBorderoValidator);

		await this.service.excludeBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async excludeBorderoItems({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(ExcludeBorderoItemValidator);

		await this.service.excludeBorderoItems(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async calculateFinanceFees({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CalculateFinanceFeeValidator);

		const result = await this.service.calculateFees(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(result);
	}

	async storeMultipleFinances({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateMultipleFinancesValidator);

		await this.service.createMultipleFinances(
			await this.sharedService.getAuthContext(auth),
			payload.items,
		);

		return response.created();
	}

	async updateFinance({
		params,
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id, user } = this.sharedService.extractUser(auth);
		const payload = await request.validate(UpdateFinanceValidator);

		const result = await this.service.updateFinance(
			unit_id,
			user,
			params.id,
			payload,
		);

		return response.ok(result);
	}

	async groupedFinanceDown({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateGroupedFinanceDownValidator);

		await this.service.groupedFinanceDown(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async updateFinanceDown({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateFinanceDownValidator);

		await this.service.updateFinanceDown(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async updateBorderoDown({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(DownBorderoValidator);

		await this.service.downBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async updateRevertBorderoDown({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(RevertDownBorderoValidator);

		await this.service.revertDownBordero(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async updateFinanceReversal({
		params,
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const payload = await request.validate(UpdateFinanceReversalValidator);

		const result = await this.service.updateFinanceReversal(
			unit_id,
			params.id,
			payload,
		);

		return response.ok(result);
	}

	async deleteFinance({ params, auth, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.deleteFinance(unit_id, params.id);

		return response.noContent();
	}

	async acceptManyFinances({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(AcceptManyFinanceValidator);

		await this.service.acceptMany(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	async openAttendances({ auth, response }: HttpContextContract) {
		const result = await this.service.getOpenAttendances(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async expiringExpenses({ auth, response }: HttpContextContract) {
		const result = await this.service.getExpiringExpenses(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async expiringPayments({ auth, response }: HttpContextContract) {
		const result = await this.service.getExpiringPayments(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async checkingAccountsResume({ auth, response }: HttpContextContract) {
		const result = await this.service.getCheckingAccountsResume(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async openCashiersResume({ auth, response }: HttpContextContract) {
		const result = await this.service.getOpenDailyCashiers(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async closedCashiersResume({ auth, response }: HttpContextContract) {
		const result = await this.service.getClosedDailyCashiers(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async revisedCashiersResume({ auth, response }: HttpContextContract) {
		const result = await this.service.getRevisedDailyCashiers(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async todayCashiersResume({ auth, response }: HttpContextContract) {
		const result = await this.service.getTodayDailyCashiers(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	async overallResume({ auth, response }: HttpContextContract) {
		const result = await this.service.getOverallResume(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}
}
