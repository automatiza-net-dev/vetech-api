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

	public async listReceived({ response, auth }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		return response.ok(await this.service.listReceived(authCtx));
	}

	public async searchReceived({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchReceived(
			authCtx,
			request.param("ref"),
		);

		return response.ok(Buffer.from(result));
	}

	public async importReceived({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.importReceived(authCtx, request.param("ref"));

		return response.ok(null);
	}
}
