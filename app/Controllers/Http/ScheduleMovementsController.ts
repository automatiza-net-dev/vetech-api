import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import ScheduleMovementsService from "App/Services/ScheduleMovementsService";
import CreateMovementValidator from "App/Validators/ScheduleMovements/CreateMovementValidator";

@inject()
export default class ScheduleMovementsController {
	constructor(
		private sharedService: SharedService,
		private service: ScheduleMovementsService,
	) {}

	public async index({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const result = await this.service.searchScheduleMovements(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			);

			return response.ok(result);
		});
	}

	public async store({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(CreateMovementValidator);

			await this.service.createScheduleMovements(
				await this.sharedService.getAuthContext(auth),
				data.items,
			);

			return response.created();
		});
	}

	public async cancel({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(CreateMovementValidator);

			await this.service.cancelScheduleMovements(
				await this.sharedService.getAuthContext(auth),
				data.items,
			);

			return response.noContent();
		});
	}
}
