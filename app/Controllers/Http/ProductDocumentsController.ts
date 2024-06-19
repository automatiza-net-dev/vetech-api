import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ProductDocumentService from "App/Services/ProductDocumentService";
import SharedService from "App/Services/SharedService";
import CreateProductDocumentValidator from "App/Validators/ProductDocument/CreateProductDocumentValidator";
import GenerateDocumentValidator from "App/Validators/ProductDocument/GenerateDocumentValidator";

@inject()
export default class ProductDocumentsController {
	constructor(
		private sharedService: SharedService,
		private service: ProductDocumentService,
	) {}

	public async index({ request, response, auth }: HttpContextContract) {
		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async store({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CreateProductDocumentValidator);

		const result = await this.service.store(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(result);
	}

	public async generateDocuments({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(GenerateDocumentValidator);

		await this.service.generateDocuments(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created();
	}

	public async destroy({ request, response, auth }: HttpContextContract) {
		await this.service.destroy(
			await this.sharedService.getAuthContext(auth),
			request.param("id"),
		);

		return response.noContent();
	}
}
