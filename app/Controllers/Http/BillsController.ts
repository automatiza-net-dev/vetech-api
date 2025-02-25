import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import BillService from "App/Services/BillService";
import SharedService from "App/Services/SharedService";
import AddKitToBillValidator from "App/Validators/Bill/AddKitToBillValidator";
import CheckDepositAvailabilityValidator from "App/Validators/Bill/CheckDepositAvailabilityValidator";
import CheckItemDiscountValidator from "App/Validators/Bill/CheckItemDiscountValidator";
import ConfirmBillPaymentsValidator from "App/Validators/Bill/ConfirmBillPaymentsValidator";
import CreateBillItemValidator from "App/Validators/Bill/CreateBillItemValidator";
import CreateBillItemsValidator from "App/Validators/Bill/CreateBillItemsValidator";
import CreateBillPaymentValidator from "App/Validators/Bill/CreateBillPaymentValidator";
import CreateBillValidator from "App/Validators/Bill/CreateBillValidator";
import CreateBillsValidator from "App/Validators/Bill/CreateBillsValidator";
import CreateTreatmentBillValidator from "App/Validators/Bill/CreateTreatmentBillValidator";
import DeletePaymentBlockValidator from "App/Validators/Bill/DeletePaymentBlockValidator";
import UpdateBillFinancialResponsibleValidator from "App/Validators/Bill/UpdateBillFinancialResponsibleValidator";
import UpdateBillItemValidator from "App/Validators/Bill/UpdateBillItemValidator";
import UpdateBillValidator from "App/Validators/Bill/UpdateBillValidator";
import UpdatePaymentExpirationValidator from "App/Validators/Bill/UpdatePaymentExpirationValidator";
import ApproveBillCourtesyMaxDiscountValidator from "App/Validators/Bill/ApproveBillCourtesyMaxDiscountValidator";
import RequestBillCancellationValidator from "App/Validators/Bill/RequestBillCancellationValidator";
import ReviewBillCancellationValidator from "App/Validators/Bill/ReviewBillCancellationValidator";
import FinishBillCancellationValidator from "App/Validators/Bill/FinishBillCancellationValidator";

@inject()
export default class BillsController {
	constructor(
		private sharedService: SharedService,
		private service: BillService,
	) {}

	public async index({ request, response, auth }: HttpContextContract) {
		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async show({ params, auth, response }: HttpContextContract) {
		const result = await this.service.show(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(result);
	}

	public async recalculate({ params, auth, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.recalculateItemsTaxes(unit_id, params.id);

		return response.ok(null);
	}

	public async checkItemDiscount({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CheckItemDiscountValidator);

		const result = await this.service.checkItemsDiscount(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		if (result.length > 0) {
			return response.badRequest(result);
		}

		return response.ok(null);
	}

	public async createBill({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateBillValidator);

			const result = await this.service.createBill(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
		});
	}

	public async createBills({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CreateBillsValidator);

		const result = await this.service.createBills(
			await this.sharedService.getAuthContext(auth),
			payload.items,
		);

		if (!result.valid) {
			return response.badRequest(result.invalid);
		}

		return response.created(result);
	}

	public async updateBill({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateBillValidator);

			await this.service.updateBill(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.ok(null);
		});
	}

	public async createBillItem({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateBillItemValidator);

		const result = await this.service.createBillItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		if (Array.isArray(result)) {
			return response.badRequest(result);
		}

		return response.created(result);
	}

	public async createBillItems({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateBillItemsValidator);

		const result = await this.service.createBillItems(
			await this.sharedService.getAuthContext(auth),
			payload.items,
		);
		if (!result.valid) {
			return response.badRequest(result.invalid);
		}

		return response.created(result);
	}

	public async updateBillItem({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateBillItemValidator);

		const result = await this.service.updateBillItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		if (Array.isArray(result)) {
			return response.badRequest(result);
		}

		return response.ok(result);
	}

	public async deleteBillItem({ params, auth, response }: HttpContextContract) {
		await this.service.deleteBillItem(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(null);
	}

	public async createBillPayment({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateBillPaymentValidator);

		const result = await this.service.createBillPayment(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async deleteBillPayment({
		params,
		response,
		auth,
	}: HttpContextContract) {
		await this.service.deleteBillPayment(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(null);
	}

	public async deleteBillPaymentBlock({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(DeletePaymentBlockValidator);

		await this.service.deleteBillPaymentBlock(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(null);
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
			quantity: qs.quantity,
			reference: qs.reference,
			barcode: qs.barcode,
		});

		return response.ok(result);
	}

	public async searchTax({ request, response, auth }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.searchTax(unit_id, {
			variation: qs.variation,
			origin: qs.origin,
			destination: qs.destination,
			category: qs.category,
			type: qs.type,
		});

		return response.ok(result);
	}

	public async excludeBill({ params, auth, response }: HttpContextContract) {
		await this.service.excludeBill(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);
		return response.ok(null);
	}

	public async closeBill({ params, auth, response }: HttpContextContract) {
		const { unit_id, user } = this.sharedService.extractUser(auth);

		await this.service.closeBill(unit_id, user, params.id);
		return response.ok(null);
	}

	public async reopenBill({ params, auth, response }: HttpContextContract) {
		const { unit_id, user } = this.sharedService.extractUser(auth);

		await this.service.reopenBill(unit_id, user, params.id);
		return response.ok(null);
	}

	public async disableBillItem({
		params,
		auth,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.disableBillItem(unit_id, params.id);
		return response.ok(null);
	}

	public async addKitToBill({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(AddKitToBillValidator);

		await this.service.addFromKit(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(null);
	}

	public async fetchConferenceCashier({
		params,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.fetchConferenceCashier(
			authCtx,
			params.id,
		);

		return response.ok(result);
	}

	public async updateCashierConference({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(ConfirmBillPaymentsValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateCashierConference(authCtx, payload);

		return response.ok(null);
	}

	public async createTreatment({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateTreatmentBillValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.createTreatmentFromBill(authCtx, payload);

		return response.ok(null);
	}

	public async updatePaymentExpiration({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdatePaymentExpirationValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updatePaymentExpiration(authCtx, payload.items);

		return response.ok(null);
	}

	public async updateBillFinancialResponsible({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(
			UpdateBillFinancialResponsibleValidator,
		);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateBillFinancialResponsible(authCtx, payload);

		return response.ok(null);
	}

	public async checkDepositAvailability({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CheckDepositAvailabilityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.checkDepositAvailability(authCtx, payload);

		return response.ok(null);
	}

	public async discountDepositItems({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CheckDepositAvailabilityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.discountDepositItems(authCtx, payload);

		return response.ok(null);
	}

	public async printPaymentReceipt({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.printPaymentReceipt(
			authCtx,
			request.param("bill"),
			request.qs(),
		);

		return response.ok(result);
	}

	public async approveBillCourtesyMaxDiscounts({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const payload = await request.validate(
			ApproveBillCourtesyMaxDiscountValidator,
		);

		await this.service.approveCourtesyOrMaxDiscount(authCtx, payload);

		return response.ok(null);
	}

	public async requestBillCancellation({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const payload = await request.validate(RequestBillCancellationValidator);

		await this.service.requestBillCancellation(authCtx, payload);

		return response.ok(null);
	}

	public async reviewBillCancellation({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const payload = await request.validate(ReviewBillCancellationValidator);

		await this.service.reviewBillCancellation(authCtx, payload);

		return response.ok(null);
	}

	public async finishBillCancellation({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const payload = await request.validate(FinishBillCancellationValidator);

		await this.service.finishBillCancellation(authCtx, payload);

		return response.ok(null);
	}
}
