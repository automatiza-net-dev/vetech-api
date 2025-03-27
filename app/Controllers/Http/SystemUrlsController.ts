import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import SystemUrlService from "App/Services/SystemUrlService";
import SearchSystemUrlValidator from "App/Validators/SystemUrl/SearchSystemUrlValidator";
import UploadImageValidator from "App/Validators/SystemUrl/UploadImageValidator";

@inject()
export default class SystemUrlsController {
	constructor(
		private sharedService: SharedService,
		private readonly service: SystemUrlService,
	) {}

	public async search({ request, response }: HttpContextContract) {
		const body = await request.validate(SearchSystemUrlValidator);

		const result = await this.service.getSystemUrl(body);

		return response.ok(result);
	}

	public async uploadImages({ auth, request, response }: HttpContextContract) {
		const body = await request.validate(UploadImageValidator);

		await this.service.uploadImages(
			await this.sharedService.getAuthContext(auth),
			body,
		);

		return response.noContent();
	}
}
