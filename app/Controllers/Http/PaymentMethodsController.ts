import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PaymentMethodService from "App/Services/PaymentMethodService";
import SharedService from "App/Services/SharedService";
import CreateDefaultCheckingAccountValidator from "App/Validators/PaymentMethod/CreateDefaultCheckingAccountValidator";
import CreatePaymentMethodFeeValidator from "App/Validators/PaymentMethod/CreatePaymentMethodFeeValidator";
import CreatePaymentMethodFlagValidator from "App/Validators/PaymentMethod/CreatePaymentMethodFlagValidator";
import CreatePaymentMethodValidator from "App/Validators/PaymentMethod/CreatePaymentMethodValidator";
import UpdateDefaultCheckingAccountValidator from "App/Validators/PaymentMethod/UpdateDefaultCheckingAccountValidator";
import UpdatePaymentMethodFlagInstallmentValidator from "App/Validators/PaymentMethod/UpdatePaymentMethodFlagInstallmentValidator";
import UpdatePaymentMethodFlagValidator from "App/Validators/PaymentMethod/UpdatePaymentMethodFlagValidator";
import UpdatePaymentMethodValidator from "App/Validators/PaymentMethod/UpdatePaymentMethodValidator";

@inject()
export default class PaymentMethodsController {
	constructor(
		private sharedService: SharedService,
		private service: PaymentMethodService,
	) {}

	public async searchPartialPaymentMethods({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.searchPartialPaymentMethods(unit_id, {
			description: qs.description,
			tef: qs.tef,
			type: qs.type,
		});

		return response.ok(result);
	}

	public async searchCompletePaymentMethods({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.searchCompletePaymentMethods(unit_id, {
			description: qs.description,
			tef: qs.tef,
			type: qs.type,
			active: qs.active,
			cancellation: qs.cancellation,
			account: qs.account,
		});

		return response.ok(result);
	}

	public async searchTefFlags({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.searchTefFlags(unit_id, {
			type: qs.type,
		});

		return response.ok(result);
	}

	public async searchTefAcquirers({ auth, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.searchTefAcquirers(unit_id);

		return response.ok(result);
	}

	public async createPaymentMethod({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreatePaymentMethodValidator);
		const result = await this.service.createPaymentMethod(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}
	public async updatePaymentMethod({
		auth,
		request,
		response,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(UpdatePaymentMethodValidator);
		const result = await this.service.updatePaymentMethod(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.ok(result);
	}

	public async createPaymentMethodFlag({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const payload = await request.validate(CreatePaymentMethodFlagValidator);
		const result = await this.service.createPaymentMethodFlag(unit_id, payload);

		return response.created(result);
	}

	public async updatePaymentMethodFlag({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const payload = await request.validate(UpdatePaymentMethodFlagValidator);
		await this.service.updatePaymentMethodFlag(unit_id, params.id, payload);

		return response.noContent();
	}

	public async createPaymentMethodFee({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const payload = await request.validate(CreatePaymentMethodFeeValidator);
		const result = await this.service.createPaymentMethodFee(unit_id, payload);

		return response.created(result);
	}

	public async updatePaymentMethodFlagInstallment({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const payload = await request.validate(
			UpdatePaymentMethodFlagInstallmentValidator,
		);
		const result = await this.service.updatePaymentMethodFlagInstallment(
			unit_id,
			params.id,
			payload,
		);

		return response.ok(result);
	}

	public async listBusinessUnitCheckingAccountPaymentMethod({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result =
			await this.service.listBusinessUnitCheckingAccountPaymentMethod(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			);

		return response.ok(result);
	}

	public async createBusinessUnitCheckingAccountPaymentMethod({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(
			CreateDefaultCheckingAccountValidator,
		);
		const result =
			await this.service.createBusinessUnitCheckAccountPaymentMethod(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

		return response.ok(result);
	}

	public async updateBusinessUnitCheckingAccountPaymentMethod({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(
			UpdateDefaultCheckingAccountValidator,
		);
		const result =
			await this.service.updateBusinessUnitCheckAccountPaymentMethod(
				await this.sharedService.getAuthContext(auth),
				payload.items,
			);

		return response.ok(result);
	}
}
