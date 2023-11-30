import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ReceiptService from "App/Services/ReceiptService";
import SharedService from "App/Services/SharedService";
import CreateReceiptItemValidator from "App/Validators/Receipt/CreateReceiptItemValidator";
import CreateReceiptPaymentValidator from "App/Validators/Receipt/CreateReceiptPaymentValidator";
import CreateReceiptValidator from "App/Validators/Receipt/CreateReceiptValidator";
import CreateSupplierProductValidator from "App/Validators/Receipt/CreateSupplierProductValidator";
import DeleteReceiptItemValidator from "App/Validators/Receipt/DeleteReceiptItemValidator";
import DeleteReceiptPaymentValidator from "App/Validators/Receipt/DeleteReceiptPaymentValidator";
import ImportFromXmlValidator from "App/Validators/Receipt/ImportFromXmlValidator";
import UpdateXmlItemValidator from "App/Validators/Receipt/UpdateXmlItemValidator";

@inject()
export default class ReceiptsController {
	constructor(
		private sharedService: SharedService,
		private service: ReceiptService,
	) {}

	public async index({ request, response, auth }: HttpContextContract) {
		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async show({ request, response, auth }: HttpContextContract) {
		const result = await this.service.show(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async updateXmlItems({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateXmlItemValidator);

		await this.service.updateXmlItems(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async importFromXml({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(ImportFromXmlValidator);

		const result = await this.service.importFromXml(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async createReceipt({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CreateReceiptValidator);

		const result = await this.service.createReceipt(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async createReceiptItem({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateReceiptItemValidator);

		const result = await this.service.createItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async deleteReceiptItem({
		request,
		auth,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(DeleteReceiptItemValidator);

		await this.service.deleteItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async createReceiptPayment({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateReceiptPaymentValidator);

		const result = await this.service.createPayment(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async deleteReceiptPayment({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(DeleteReceiptPaymentValidator);

		await this.service.deletePayment(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async searchProducts({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const result = await this.service.searchProducts(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchTaxes({ request, response, auth }: HttpContextContract) {
		const result = await this.service.searchTax(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchPaymentMethods({ response, auth }: HttpContextContract) {
		const result = await this.service.searchPaymentMethods(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	public async createSupplierProducts({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateSupplierProductValidator);

		await this.service.createSupplierProducts(
			await this.sharedService.getAuthContext(auth),
			payload.items,
		);

		return response.created();
	}
}
