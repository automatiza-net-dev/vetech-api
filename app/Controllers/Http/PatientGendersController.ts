import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PatientGenderService from "App/Services/PatientGenderService";
import SharedService from "App/Services/SharedService";

@inject()
export default class PatientGendersController {
	constructor(
		private sharedService: SharedService,
		private service: PatientGenderService,
	) {}

	public async list({ request, response, auth }: HttpContextContract) {
		const result = await this.service.distinctGenders(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}
}
