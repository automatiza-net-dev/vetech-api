import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import VaccineService from "App/Services/VaccineService";
import CreateVaccineValidator from "App/Validators/Vaccine/CreateVaccineValidator";
import UpdateVaccineValidator from "App/Validators/Vaccine/UpdateVaccineValidator";

@inject()
export default class VaccinesController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly service: VaccineService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			{
				name: qs.name,
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

	public async status({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.status(
			await this.sharedService.getAuthContext(auth),
			params.id,
			request.qs(),
		);

		return response.ok(result);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateVaccineValidator);

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
		const payload = await request.validate(UpdateVaccineValidator);

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
