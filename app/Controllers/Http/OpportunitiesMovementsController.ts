import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import UpsertOpportunityMovementValidator from "App/Validators/OpportunityMovements/UpsertOpportunityMovementValidator";
import OpportunityMovementsService from "App/Services/OpportunityMovementsService";

@inject()
export default class OpportunityMovementsController {
	constructor(
		private sharedService: SharedService,
		private service: OpportunityMovementsService,
	) {}

	public async index({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const result = await this.service.index(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			);

			return response.ok(result);
		});
	}

	public async searchFromClients({
		request,
		response,
		auth,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const result = await this.service.searchFromClients(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			);

			return response.ok(result);
		});
	}

	public async search({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const result = await this.service.searchOpportunityMovements(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			);

			return response.ok(result);
		});
	}

	public async store({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(UpsertOpportunityMovementValidator);

			await this.service.createOpportunityMovements(
				await this.sharedService.getAuthContext(auth),
				data.items,
			);

			return response.created();
		});
	}

	public async cancel({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(UpsertOpportunityMovementValidator);

			await this.service.cancelOpportunityMovements(
				await this.sharedService.getAuthContext(auth),
				data.items,
			);

			return response.noContent();
		});
	}
}
