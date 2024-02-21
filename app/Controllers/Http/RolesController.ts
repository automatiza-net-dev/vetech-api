import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import RoleService from "App/Services/RoleService";
import SharedService from "App/Services/SharedService";
import AddRolePermissionsValidator from "App/Validators/Role/AddRolePermissionsValidator";
import CopyRoleValidator from "App/Validators/Role/CopyRoleValidator";
import CreateRoleValidator from "App/Validators/Role/CreateRoleValidator";
import ManageRolePermissionValidator from "App/Validators/Role/ManageRolePermissionValidator";
import UpdateRoleValidator from "App/Validators/Role/UpdateRoleValidator";

@inject()
export default class RolesController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly roleService: RoleService,
	) {}

	public async index({ request, response, auth }: HttpContextContract) {
		const qs = request.qs();

		response.ok(
			await this.roleService.index(
				await this.sharedService.getAuthContext(auth),
				{
					name: qs.name,
				},
			),
		);
	}

	public async controllerIndex({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const qs = request.qs();

		response.ok(
			await this.roleService.controllerIndex(auth.user?.system_id ?? -1, {
				name: qs.name,
			}),
		);
	}

	public async show({ params, response, auth }: HttpContextContract) {
		response.ok(
			await this.roleService.show(
				await this.sharedService.getAuthContext(auth),
				params.id,
			),
		);
	}

	public async permissionMetadata({
		params,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.roleService.rolePermissionMetadata(
				auth.user?.system_id ?? -1,
				params.id,
			),
		);
	}

	public async store({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CreateRoleValidator);
		const newRole = await this.roleService.store(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(newRole);
	}

	public async storeController({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateRoleValidator);
		const newRole = await this.roleService.storeController(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(newRole);
	}

	public async addPermissions({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(AddRolePermissionsValidator);
		await this.roleService.addPermissionsToRole(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async managePermissions({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(ManageRolePermissionValidator);
		await this.roleService.manageRolePermissions(
			auth.user?.system_id ?? -1,
			payload,
		);

		return response.noContent();
	}

	public async update({
		params,
		request,
		response,
		auth,
	}: HttpContextContract) {
		const { id } = params;
		const payload = await request.validate(UpdateRoleValidator);
		const updatedRole = await this.roleService.update(
			await this.sharedService.getAuthContext(auth),
			id,
			payload,
		);

		return response.created(updatedRole);
	}

	public async updateController({
		params,
		request,
		response,
		auth,
	}: HttpContextContract) {
		const { id } = params;
		const payload = await request.validate(UpdateRoleValidator);
		const updatedRole = await this.roleService.updateController(
			auth?.user?.system_id ?? -1,
			id,
			payload,
		);

		return response.ok(updatedRole);
	}

	public async destroy({ params, response, auth }: HttpContextContract) {
		const { id } = params;
		await this.roleService.delete(
			await this.sharedService.getAuthContext(auth),
			id,
		);

		return response.noContent();
	}

	public async destroyController({
		params,
		response,
		auth,
	}: HttpContextContract) {
		const { id } = params;
		await this.roleService.deleteController(auth.user?.system_id ?? -1, id);

		return response.noContent();
	}

	public async searchInfo({ request, response, auth }: HttpContextContract) {
		const qs = request.qs();

		response.ok(
			await this.roleService.searchRolePermissions(
				await this.sharedService.getAuthContext(auth),
				{
					id: qs.id,
					active: qs.active,
				},
			),
		);
	}

	public async searchControllerInfo({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const qs = request.qs();

		response.ok(
			await this.roleService.searchControllerRolePermissions(
				auth.user?.system_id ?? -1,
				auth?.user && "type" in auth.user ? auth.user.type : "user",
				{
					id: qs.id,
					active: qs.active,
				},
			),
		);
	}

	public async copyRole({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CopyRoleValidator);
		const result = await this.roleService.copyRole(
			auth.user?.system_id ?? -1,
			payload,
		);

		return response.created(result);
	}
}
