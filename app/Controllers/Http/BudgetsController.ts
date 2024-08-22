import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import BudgetService from "App/Services/BudgetService";
import SharedService from "App/Services/SharedService";
import AddKitToBudgetValidator from "App/Validators/Budget/AddKitToBudgetValidator";
import ApproveBudgetCourtesyMaxDiscountValidator from "App/Validators/Budget/ApproveBudgetCourtesyMaxDiscountValidator";
import CancelBudgetValidator from "App/Validators/Budget/CancelBudgetValidator";
import ConfirmBudgetValidator from "App/Validators/Budget/ConfirmBudgetValidator";
import CreateBudgetItemsValidator from "App/Validators/Budget/CreateBudgetItemsValidator";
import CreateBudgetItemValidator from "App/Validators/Budget/CreateBudgetItemValidator";
import CreateBudgetPaymentValidator from "App/Validators/Budget/CreateBudgetPaymentValidator";
import CreateBudgetValidator from "App/Validators/Budget/CreateBudgetValidator";
import ExcludeBudgetPaymentValidator from "App/Validators/Budget/ExcludeBudgetPaymentValidator";
import UpdateBudgetItemValidator from "App/Validators/Budget/UpdateBudgetItemValidator";
import UpdateBudgetObservationValidator from "App/Validators/Budget/UpdateBudgetObservationValidator";
import UpdateBudgetPaymentValidator from "App/Validators/Budget/UpdateBudgetPaymentValidator";
import UpdateBudgetValidator from "App/Validators/Budget/UpdateBudgetValidator";

@inject()
export default class BudgetsController {
	constructor(
		private sharedService: SharedService,
		private service: BudgetService,
	) {}

	public async fromAttendance({ params, response, auth }: HttpContextContract) {
		const result = await this.service.budgetsFromAttendance(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);
		return response.ok(result);
	}

	public async openNegotiations({
		params,
		response,
		auth,
	}: HttpContextContract) {
		const result = await this.service.listOpenNegotiations(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);
		return response.ok(result);
	}

	public async partialIndex({ request, response, auth }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.partialIndex(unit_id, request.qs());

		return response.ok(result);
	}

	public async completeIndex({ request, response, auth }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.completeIndex(unit_id, request.qs());

		return response.ok(result);
	}

	public async show({ params, response, auth }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.show(unit_id, params.id);

		return response.ok(result);
	}

	public async searchProducts({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.searchProducts(unit_id, {
			variation: qs.variation,
			description: qs.description,
			unit: qs.unit,
			quantity: qs.quantity,
			minPrice: qs.minPrice,
			maxPrice: qs.maxPrice,
			maxDiscountPercentage: qs.maxDiscountPercentage,
			reference: qs.reference,
			barcode: qs.barcode,
		});

		return response.ok(result);
	}

	public async createBudget({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateBudgetValidator);

			const result = await this.service.createBudget(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
		});
	}

	public async updateBudget({
		request,
		response,
		params,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateBudgetValidator);

		await this.service.updateBudget(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.noContent();
	}

	public async updateBudgetObservation({
		request,
		response,
		params,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateBudgetObservationValidator);

		await this.service.updateBudgetObservation(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.noContent();
	}

	public async createBudgetItem({
		request,
		response,
		auth,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateBudgetItemValidator);

			const result = await this.service.createBudgetItem(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
		});
	}

	public async createBudgetItems({
		request,
		response,
		auth,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateBudgetItemsValidator);

			await this.service.createBudgetItems(
				await this.sharedService.getAuthContext(auth),
				payload.items,
			);

			return response.created();
		});
	}

	public async updateBudgetItems({
		request,
		response,
		auth,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateBudgetItemValidator);

			await this.service.updateBudgetItem(
				await this.sharedService.getAuthContext(auth),
				payload.items,
			);

			return response.ok(null);
		});
	}

	public async deleteBudgetItem({
		params,
		response,
		auth,
	}: HttpContextContract) {
		await this.service.deleteBudgetItem(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.noContent();
	}

	public async confirmBudget({
		params,
		request,
		response,
		auth,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(ConfirmBudgetValidator);

			const result = await this.service.confirmBudget(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(result);
		});
	}

	public async cancelBudget({
		params,
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CancelBudgetValidator);
		const { unit_id, user } = this.sharedService.extractUser(auth);

		await this.service.cancelBudget(unit_id, params.id, user, payload);

		return response.noContent();
	}

	public async deleteBudget({ params, response, auth }: HttpContextContract) {
		await this.service.deleteBudget(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.noContent();
	}

	public async addKitToBudget({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(AddKitToBudgetValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.addFromKit(unit_id, payload);

		return response.noContent();
	}

	public async createBudgetPayments({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateBudgetPaymentValidator);

		await this.service.createBudgetPayments(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created();
	}

	public async updateBudgetPayment({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateBudgetPaymentValidator);

		await this.service.updateBudgetPayment(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async excludeBudgetPayment({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(ExcludeBudgetPaymentValidator);

		await this.service.excludeBudgetPayment(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async listBudgetPayments({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const result = await this.service.listBudgetPayments(
			await this.sharedService.getAuthContext(auth),
			request.params().id,
			request.qs(),
		);

		return response.ok(result);
	}

	public async approveBudgetCourtesyMaxDiscounts({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const payload = await request.validate(
			ApproveBudgetCourtesyMaxDiscountValidator,
		);

		await this.service.approveCourtesyOrMaxDiscount(authCtx, payload);

		return response.noContent();
	}
}
