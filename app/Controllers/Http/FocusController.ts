import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import BusinessUnitFiscalDocumentService from "App/Services/BusinessUnitFiscalDocumentService";

@inject()
export default class FocusController {
	constructor(
		private sharedService: SharedService,
		private service: BusinessUnitFiscalDocumentService,
	) {}

	public async search({ request, response, auth }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		return response.ok({
			url: await this.service.getPeriodXmls(authCtx, {
				periodo: request.qs().periodo,
				businessUnitId: request.qs().businessUnitId,
			}),
		});
	}
}
