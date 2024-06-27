import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DreService from "App/Services/DreService";
import SharedService from "App/Services/SharedService";

@inject()
export default class DreController {
	constructor(
		private sharedService: SharedService,
		private service: DreService,
	) {}

	public async generateDreSpreadsheet({ response, auth }: HttpContextContract) {
		const result = await this.service.generateDreSpreadsheet(
			await this.sharedService.getAuthContext(auth),
		);

		return response.download(result);
	}
}
