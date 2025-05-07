import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import VariationGroupService from "App/Services/VariationGroupService";
import CreateVariationGroupValidator from "App/Validators/Variation/CreateVariationGroupValidator";
import CreateVariationVariationValidator from "App/Validators/Variation/CreateVariationVariationValidator";
import UpdateVariationGroupValidator from "App/Validators/Variation/UpdateVariationGroupValidator";

@inject()
export default class VariationGroupsController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly service: VariationGroupService,
	) {}

	public async index({ auth, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.index(unit_id);

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.show(unit_id, params.id);

		return response.ok(result);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateVariationGroupValidator);
			const result = await this.service.store(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
		});
	}

	public async assign({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateVariationVariationValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.assignVariation(unit_id, payload);

		return response.created();
	}

	public async detach({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.detach(unit_id, params.group, params.variation);

		return response.created();
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateVariationGroupValidator);

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
