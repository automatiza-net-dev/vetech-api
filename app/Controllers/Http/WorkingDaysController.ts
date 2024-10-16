import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import WorkingDayService from "App/Services/WorkingDayService";
import CreateManyWorkingDayValidator from "App/Validators/WorkingDay/CreateManyWorkingDayValidator";
import CreateWorkingDayValidator from "App/Validators/WorkingDay/CreateWorkingDayValidator";
import UpdateWorkingDayValidator from "App/Validators/WorkingDay/UpdateWorkingDayValidator";

@inject()
export default class WorkingDaysController {
	constructor(
		private readonly service: WorkingDayService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();

		const data = await this.service.index(unit_id, qs.user);

		return response.ok(data);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const data = await this.service.show(unit_id, params.id);

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateWorkingDayValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		const data = await this.service.store(unit_id, payload);

		return response.created(data);
	}

	public async storeMany({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateManyWorkingDayValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		const data = await this.service.storeMany(unit_id, payload);

		return response.created(data);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateWorkingDayValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		const data = await this.service.update(unit_id, params.id, payload);

		return response.ok(data);
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.destroy(unit_id, params.id);

		return response.noContent();
	}
}
