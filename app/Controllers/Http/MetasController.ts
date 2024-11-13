import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import MetaService from "App/Services/MetaService";
import SharedService from "App/Services/SharedService";
import CreateMetaValidator from "App/Validators/Meta/CreateMetaValidator";
import UpdateMetaValidator from "App/Validators/Meta/UpdateMetaValidator";

@inject()
export default class MetasController {
	constructor(
		private sharedService: SharedService,
		private service: MetaService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.index(authCtx, request.qs());

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateMetaValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);
			const data = await this.service.store(authCtx, payload);

			return response.created(data);
		});
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateMetaValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);
			await this.service.update(authCtx, params.id, payload);

			return response.noContent();
		});
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const authCtx = await this.sharedService.getAuthContext(auth);
			await this.service.destroy(authCtx, params.id);

			return response.noContent();
		});
	}
}
