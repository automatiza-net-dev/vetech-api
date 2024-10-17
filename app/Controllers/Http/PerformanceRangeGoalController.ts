import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import PerformanceRangeGoalService from "App/Services/PerformanceRangeGoalService";
import SharedService from "App/Services/SharedService";
import UpsertGoalValidator from "App/Validators/PerformanceRangeGoal/UpsertGoalValidator";

@inject()
export default class PerformanceRangeGoalController {
	constructor(
		private sharedService: SharedService,
		private service: PerformanceRangeGoalService,
	) {}

	public async search({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.search(authCtx, request.param("id"));

		return response.ok(data);
	}

	// public async store({ auth, request, response }: HttpContextContract) {
	// 	const payload = await request.validate(UpsertGoalValidator);
	// 	const authCtx = await this.sharedService.getAuthContext(auth);
	//
	// 	await this.service.store(authCtx, payload);
	//
	// 	return response.created();
	// }

	public async update({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpsertGoalValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.update(authCtx, payload);

		return response.ok(data);
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.delete(authCtx, {
			metaId: params.id,
		});

		return response.noContent();
	}
}
