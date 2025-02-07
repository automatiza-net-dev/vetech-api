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
		const user = auth.use("api").user!;
		const data = await this.service.dashboard(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async billing({ auth, request, response }: HttpContextContract) {
		const user = auth.use("api").user!;
		const data = await this.service.billing(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async monthlyBilling({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const user = auth.use("api").user!;

		const data = await this.service.monthlyBilling(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async salesByPeriod({ auth, request, response }: HttpContextContract) {
		const user = auth.use("api").user!;
		const data = await this.service.salesByPeriod(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async sellerBillingRanking({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const user = auth.use("api").user!;
		const data = await this.service.sellerBillingRanking(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async billingRanking({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const user = auth.use("api").user!;
		const data = await this.service.billingRanking(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async avgTicket({ auth, request, response }: HttpContextContract) {
		const user = auth.use("api").user!;
		const data = await this.service.avgTicket(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}

	public async invoicingProductTypeSubgroup({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const user = auth.use("api").user!;
		const data = await this.service.invoicingProductTypeSubgroup(
			{ systemID: user.system_id, user },
			request.qs(),
		);

		return response.ok(data);
	}
}
