import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import MarketingCampaignService from "App/Services/MarketingCampaignService";
import CreateCampaignValidator from "App/Validators/MarketingCampaign/CreateCampaignValidator";
import UpdateCampaignValidator from "App/Validators/MarketingCampaign/UpdateCampaignValidator";

@inject()
export default class MarketingCampaignsController {
	constructor(
		private sharedService: SharedService,
		private service: MarketingCampaignService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const authCtx = await this.sharedService.getAuthContext(auth);

			const data = await this.service.index(authCtx, request.qs());

			return response.ok(data);
		});
	}

	public async search({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.search(authCtx, request.qs());

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateCampaignValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const data = await this.service.store(authCtx, payload);

			return response.created(data);
		});
	}

	public async update({ auth, request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateCampaignValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const data = await this.service.update(authCtx, payload);

			return response.ok(data);
		});
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const authCtx = await this.sharedService.getAuthContext(auth);
			await this.service.delete(authCtx, params.id);

			return response.noContent();
		});
	}
}
