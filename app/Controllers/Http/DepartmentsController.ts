import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DepartmentService from "App/Services/DepartmentService";
import SharedService from "App/Services/SharedService";
import CreateDepartmentValidator from "App/Validators/Department/CreateDepartmentValidator";
import UpdateDepartmentValidator from "App/Validators/Department/UpdateDepartmentValidator";

@inject()
export default class DepartmentsController {
	constructor(
		private sharedService: SharedService,
		private service: DepartmentService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.index(authCtx, request.qs());

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDepartmentValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.store(authCtx, payload);

		return response.created(data);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateDepartmentValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.update(authCtx, params.id, payload);

		return response.ok(data);
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		await this.service.destroy(authCtx, params.id);

		return response.noContent();
	}
}
