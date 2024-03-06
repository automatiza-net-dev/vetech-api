import { inject } from "@adonisjs/fold";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DocumentTemplateService from "App/Services/DocumentTemplateService";
import SharedService from "App/Services/SharedService";
import CreateDocumentTemplateValidator from "App/Validators/DocumentTemplate/CreateDocumentTemplateValidator";
import UpdateDocumentTemplateValidator from "App/Validators/DocumentTemplate/UpdateDocumentTemplateValidator";

@inject()
export default class DocumentTemplatesController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly service: DocumentTemplateService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();

		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			{
				title: qs.title,
				description: qs.description,
			},
		);

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const result = await this.service.show(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(result);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDocumentTemplateValidator);

		const result = await this.service.store(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async uploadFile({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDocumentTemplateValidator);

		const result = await this.service.uploadFile(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateDocumentTemplateValidator);

		const result = await this.service.update(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.ok(result);
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		await this.service.destroy(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.noContent();
	}
}
