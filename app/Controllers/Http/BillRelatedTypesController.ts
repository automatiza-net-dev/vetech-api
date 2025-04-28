import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import BillRelatedTypeService from "App/Services/BillRelatedTypeService";
import CreateBillRelatedTypeValidator from "App/Validators/BillRelatedType/CreateBillRelatedTypeValidator";
import UpdateBillRelatedTypeValidator from "App/Validators/BillRelatedType/UpdateBillRelatedTypeValidator";

@inject()
export default class BillRelatedTypesController {
	constructor(
		private sharedService: SharedService,
		private service: BillRelatedTypeService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.index(authCtx, request.qs());

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateBillRelatedTypeValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.store(authCtx, payload);

		return response.created(data);
	}

	public async update({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateBillRelatedTypeValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.update(authCtx, payload);

		return response.ok(data);
	}

	public async delete({ auth, params, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		await this.service.delete(authCtx, {
			id: params.id,
		});

		return response.noContent();
	}
}
