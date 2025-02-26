import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DepartmentService from "App/Services/DepartmentService";
import SharedService from "App/Services/SharedService";
import CreateDepartmentItemValidator from "App/Validators/Department/CreateDepartmentItemValidator";
import CreateDepartmentProductValidator from "App/Validators/Department/CreateDepartmentProductValidator";
import CreateDepartmentValidator from "App/Validators/Department/CreateDepartmentValidator";
import DestroyDepartmentItemValidator from "App/Validators/Department/DestroyDepartmentItemValidator";
import UpdateDepartmentItemValidator from "App/Validators/Department/UpdateDepartmentItemValidator";
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

	public async listProducts({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.listDepartmentProducts(
			authCtx,
			request.qs(),
		);

		return response.ok(data);
	}

	public async listItems({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.listDepartmentItems(authCtx, request.qs());

		return response.ok(data);
	}

	public async listProductsMovements({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.listDepartmentProductsForMovements(
			authCtx,
			request.qs(),
		);

		return response.ok(data);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDepartmentValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.store(authCtx, payload);

		return response.created(data);
	}

	public async storeProducts({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDepartmentProductValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.storeDepartmentProducts(authCtx, payload);

		return response.created(data);
	}

	public async storeItem({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDepartmentItemValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.createDepartmentItem(authCtx, payload);

		return response.ok(data);
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

	public async updateProducts({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateDepartmentProductValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateDepartmentProducts(authCtx, payload);

		return response.noContent();
	}

	public async updateItem({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateDepartmentItemValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const data = await this.service.updateDepartmentItem(
			authCtx,
			request.param("id", "-1"),
			payload,
		);

		return response.ok(data);
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		await this.service.destroy(authCtx, params.id);

		return response.noContent();
	}

	public async destroyProducts({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateDepartmentProductValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.destroyDepartmentProducts(authCtx, payload);

		return response.noContent();
	}

	public async destroyItem({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(DestroyDepartmentItemValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.deleteDepartmentItem(
			authCtx,
			request.param("id", "-1"),
			payload,
		);

		return response.noContent();
	}
}
