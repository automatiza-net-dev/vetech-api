import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import VariationService from "App/Services/VariationService";
import CreateVariationValidator from "App/Validators/Variation/CreateVariationValidator";
import UpdateVariationValidator from "App/Validators/Variation/UpdateVariationValidator";

@inject()
export default class VariationsController {
	constructor(
		protected readonly service: VariationService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.index(unit_id, {
			description: qs.description,
		});

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.show(unit_id, params.id);

		return response.ok(result);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateVariationValidator);
			const result = await this.service.store(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
		});
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateVariationValidator);

			const result = await this.service.update(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(result);
		});
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.destroy(unit_id, params.id);

		return response.noContent();
	}
}
