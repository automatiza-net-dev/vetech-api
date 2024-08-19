import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ScheduleServiceGroupService from "App/Services/ScheduleServiceGroupService";
import SharedService from "App/Services/SharedService";
import CreateScheduleServiceGroupValidator from "App/Validators/ScheduleServiceGroup/CreateScheduleServiceGroupValidator";
import UpdateScheduleServiceGroupValidator from "App/Validators/ScheduleServiceGroup/UpdateScheduleServiceGroupValidator";

@inject()
export default class ScheduleServiceGroupsController {
	constructor(
		private readonly service: ScheduleServiceGroupService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const data = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(data);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const data = await this.service.show(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateScheduleServiceGroupValidator);

		const data = await this.service.store(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(data);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateScheduleServiceGroupValidator);

		const data = await this.service.update(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.created(data);
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		await this.service.destroy(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.noContent();
	}
}
