import { inject } from "@adonisjs/fold";
import {
	validator,
	schema,
	type TypedSchema,
	StringType,
} from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import BusinessUnitService from "App/Services/BusinessUnitService";
import SharedService from "App/Services/SharedService";
import UserRoleService from "App/Services/UserRoleService";
import AddBusinessUnitCollaboratorValidator from "App/Validators/BusinessUnit/AddBusinessUnitCollaboratorValidator";
import CreateBusinessUnitCollaboratorValidator from "App/Validators/BusinessUnit/CreateBusinessUnitCollaboratorValidator";
import CreateBusinessUnitValidator from "App/Validators/BusinessUnit/CreateBusinessUnitValidator";
import MergeConfigValidator from "App/Validators/BusinessUnit/MergeConfigValidator";
import UpdateBusinessUnitAcquirerValidator from "App/Validators/BusinessUnit/UpdateBusinessUnitAcquirerValidator";
import UpdateBusinessUnitValidator from "App/Validators/BusinessUnit/UpdateBusinessUnitValidator";
import UpdateUnitUserValidator from "App/Validators/BusinessUnit/UpdateUnitUserValidator";
import UpdateUsersRoleValidator from "App/Validators/Role/UpdateUsersRoleValidator";
import BadRequestException from "App/Exceptions/BadRequestException";

@inject()
export default class BusinessUnitsController {
	constructor(
		private readonly service: BusinessUnitService,
		private readonly userRoleService: UserRoleService,
		private readonly sharedService: SharedService,
	) {}

	public async states({ response, auth }: HttpContextContract) {
		return response.ok(
			await this.service.calculateStates(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async syncConfig({ response, auth }: HttpContextContract) {
		await this.service.syncConfig(
			await this.sharedService.getAuthContext(auth),
		);

		return response.noContent();
	}

	public async index({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		return response.ok(
			await this.service.index(await this.sharedService.getAuthContext(auth), {
				email: qs.email,
				identification: qs.identification,
			}),
		);
	}

	public async systemUnits({ auth, response }: HttpContextContract) {
		const user = auth.use("api").user!;

		return response.ok(await this.service.systemUnits(user.system_id));
	}

	public async show({ params, response }: HttpContextContract) {
		return response.ok(await this.service.show(params.id));
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateBusinessUnitValidator);

		const result = await this.service.store(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async addCollaborator({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(
			AddBusinessUnitCollaboratorValidator,
		);
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.addCollaborator(unit_id, payload);

		return response.created();
	}

	public async createCollaborator({
		auth,
		request,
		response,
	}: HttpContextContract) {
		await this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(
				CreateBusinessUnitCollaboratorValidator,
			);
			await this.service.createCollaborator(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created();
		});
	}

	public async update({ params, request, response }: HttpContextContract) {
		const { id } = params;
		const payload = await request.validate(UpdateBusinessUnitValidator);
		const updatedUnit = await this.service.update(id, payload);

		return response.ok(updatedUnit);
	}

	public async updateAcquirer({
		params,
		request,
		response,
		auth,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const payload = await request.validate(UpdateBusinessUnitAcquirerValidator);
		await this.service.updateAcquirer(unit_id, params.id, payload);

		return response.noContent();
	}

	public async deleteAcquirer({ params, response, auth }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.deleteAcquirer(unit_id, params.id);

		return response.noContent();
	}

	public async updateUser({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const { id } = params;
		const payload = await request.validate(UpdateUnitUserValidator);
		const { unit_id, user } = this.sharedService.extractUser(auth);

		const updatedUnit = await this.service.updateUser(
			unit_id,
			user,
			id,
			payload,
		);

		return response.ok(updatedUnit);
	}

	public async users({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const users = await this.userRoleService.getUnitUsers(unit_id, {
			name: qs.name,
			document: qs.document,
			phone: qs.phone,
			role: qs.role,
		});

		return response.ok(users);
	}

	public async searchUser({ auth, params, response }: HttpContextContract) {
		const groups = await this.service.searchUser(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(groups);
	}

	public async user({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const groups = await this.service.getUserBusinessUnits(
			await this.sharedService.getAuthContext(auth),
			qs,
		);

		return response.ok(groups);
	}

	public async deleteUser({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.userRoleService.deleteUserFromBusiness(unit_id, params.id);

		return response.noContent();
	}

	public async updateUsersRole({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const { data } = await request.validate(UpdateUsersRoleValidator);

		await this.userRoleService.updateUserRoles(unit_id, data);

		return response.noContent();
	}

	public async checkDocument({ params, response }: HttpContextContract) {
		const { document } = params;
		const result = await this.service.checkExistingDocument(document);

		return response.ok(result);
	}

	public async mergeConfig({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(MergeConfigValidator);

		await this.service.mergeConfig(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async testDynamicForm({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const formEntry = authCtx.unit.unitConfig.formFields[request.param("form")];
		if (!formEntry) {
			throw new BadRequestException(
				`Valores possíveis: ${Object.keys(authCtx.unit.unitConfig.formFields).join(", ")}`,
				400,
				"E_ERR",
			);
		}

		const result = await validator.validate({
			schema: schema.create(SharedService.CreateDynamicValidator(formEntry)),
			messages: SharedService.CreateDynamicErrorMessages(formEntry),
			data: request.body(),
		});

		return response.ok(result);
	}
}
