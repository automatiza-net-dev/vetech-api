import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SystemUrlService from "App/Services/SystemUrlService";
import SearchSystemUrlValidator from "App/Validators/SystemUrl/SearchSystemUrlValidator";

@inject()
export default class SystemUrlsController {
	constructor(private readonly service: SystemUrlService) {}

	public async search({ request, response }: HttpContextContract) {
		const body = await request.validate(SearchSystemUrlValidator);

		const result = await this.service.getSystemUrl(body);

		return response.ok(result);
	}
}
