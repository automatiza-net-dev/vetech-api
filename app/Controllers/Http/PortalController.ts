import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PortalService from "App/Services/PortalService";
import SharedService from "App/Services/SharedService";

@inject()
export default class AccountPlanGroupsController {
	constructor(
		private sharedService: SharedService,
		private service: PortalService,
	) {}

	public async dashboard({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.dashboard(authCtx, request.qs());

		return response.ok(data);
	}

	public async billing({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.billing(authCtx, request.qs());

		return response.ok(data);
	}

	public async sellerBillingRanking({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.sellerBillingRanking(authCtx, request.qs());

		return response.ok(data);
	}

	public async billingRanking({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.billingRanking(authCtx, request.qs());

		return response.ok(data);
	}

	public async avgTicket({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.avgTicket(authCtx, request.qs());

		return response.ok(data);
	}
}
