import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import FocusNfeBusinessManagementService from "App/Services/FocusNfeBusinessManagementService";
import CreateBusinessValidator from "App/Validators/FocusManagement/CreateBusinessValidator";

@inject()
export default class FocusManagementController {
	constructor(
		private sharedService: SharedService,
		private service: FocusNfeBusinessManagementService,
	) {}

	public async createBusiness({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const payload = await request.validate(CreateBusinessValidator);

		await this.service.createBusiness(authCtx, payload);

		return response.ok(null);
	}
}
