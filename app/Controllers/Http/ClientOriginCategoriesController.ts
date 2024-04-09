import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ClientOriginCategoryService from "App/Services/ClientOriginCategoryService";
import SharedService from "App/Services/SharedService";
import UpsertClientOriginCategoryValidator from "App/Validators/ClientOriginCategory/UpsertClientOriginCategoryValidator";

@inject()
export default class ClientOriginCategoriesController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly service: ClientOriginCategoryService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			qs,
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
		const payload = await request.validate(UpsertClientOriginCategoryValidator);

		const result = await this.service.store(
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
		const payload = await request.validate(UpsertClientOriginCategoryValidator);

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
