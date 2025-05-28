import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import FocusNfeBusinessManagementService from "App/Services/FocusNfeBusinessManagementService";
import CreateBusinessValidator from "App/Validators/FocusManagement/CreateBusinessValidator";
import CreateBusiness_0Validator from "App/Validators/FocusManagement/CreateBusiness_0Validator";
import CreateBusiness_65Validator from "App/Validators/FocusManagement/CreateBusiness_65Validator";
import CreateBusiness_55_65Validator from "App/Validators/FocusManagement/CreateBusiness_55_65Validator";
import CreateBusiness_55Validator from "App/Validators/FocusManagement/CreateBusiness_55Validator";

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
		let payload: {
			businessUnitId: string;
			models: number[];
		} & Record<string, string | number | number[]> = await request.validate(
			CreateBusinessValidator,
		);

		if (payload.models.includes(0)) {
			payload = Object.assign(
				payload,
				await request.validate(CreateBusiness_0Validator),
			);
		}

		if (payload.models.includes(65)) {
			payload = Object.assign(
				payload,
				await request.validate(CreateBusiness_65Validator),
			);
			payload = Object.assign(
				payload,
				await request.validate(CreateBusiness_55_65Validator),
			);
		}

		if (payload.models.includes(55)) {
			payload = Object.assign(
				payload,
				await request.validate(CreateBusiness_55Validator),
			);
			payload = Object.assign(
				payload,
				await request.validate(CreateBusiness_55_65Validator),
			);
		}

		await this.service.createBusiness(authCtx, payload);

		return response.ok(null);
	}
}
