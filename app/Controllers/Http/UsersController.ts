import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import UserService from "App/Services/UserService";
import ChangePasswordValidator from "App/Validators/User/ChangePasswordValidator";
import ConfirmConfirmationTokenValidator from "App/Validators/User/ConfirmConfirmationTokenValidator";
import CreateConfirmationTokenValidator from "App/Validators/User/CreateConfirmationTokenValidator";
import CreateUserControllerValidator from "App/Validators/User/CreateUserControllerValidator";
import DisableUserControllerRoleValidator from "App/Validators/User/DisableUserControllerRoleValidator";
import UpdateUserControllerValidator from "App/Validators/User/UpdateUserControllerValidator";
import UpdateUserValidator from "App/Validators/User/UpdateUserValidator";
import { ValidationException } from "@ioc:Adonis/Core/Validator";

@inject()
export default class UsersController {
	constructor(
		private readonly service: UserService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ request, response }: HttpContextContract) {
		const qs = request.qs();

		return response.ok(
			await this.service.index({
				name: qs.name,
				email: qs.email,
				document: qs.document,
				phone: qs.phone,
			}),
		);
	}

	public async show({ params, response }: HttpContextContract) {
		const { id } = params;
		const user = await this.service.show(id);
		return response.ok(user);
	}

	public async checkEmail({ params, response }: HttpContextContract) {
		const { email } = params;
		const result = await this.service.checkExistingEmail(email);

		return response.ok(result);
	}

	public async checkDocument({ params, response }: HttpContextContract) {
		const { document } = params;
		const result = await this.service.checkExistingDocument(document);

		return response.ok(result);
	}

	public async resendConfirmationToken({
		params,
		response,
	}: HttpContextContract) {
		const { email } = params;
		await this.service.resendConfirmationToken(email);

		return response.noContent();
	}

	public async createConfirmationToken({
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateConfirmationTokenValidator);
		await this.service.createConfirmationToken(payload);

		return response.noContent();
	}

	public async confirmConfirmationToken({
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(ConfirmConfirmationTokenValidator);
		await this.service.confirmConfirmationToken(payload);

		return response.noContent();
	}

	public async update({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateUserValidator);
		const { user } = this.sharedService.extractUser(auth);

		const updatedUser = await this.service.update(user, payload);

		return response.ok(updatedUser);
	}

	public async destroy({ auth, response }: HttpContextContract) {
		const { user } = this.sharedService.extractUser(auth);

		await this.service.delete(user);

		return response.noContent();
	}

	public async handleChangePasswordEmail({
		auth,
		response,
	}: HttpContextContract) {
		await this.service.sendChangePasswordEmail(
			await this.sharedService.getAuthContext(auth),
		);

		return response.noContent();
	}

	public async handleChangePassword({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(ChangePasswordValidator);
		await this.service.handleChangePasswordEmail(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	private static intlMap = {
		id: "ID",
		name: "Nome",
		email: "Email",
		document: "CPF/CNPJ",
		password: "Senha",
		roleId: "Cargo",
		units: "Unidades",
		phone: "Telefone",
		postalCode: "CEP",
		address: "Rua",
		number: "Número",
		complement: "Complemento",
		district: "Bairro",
		city: "Cidade",
		state: "Estado",
		saleDepositId: "Depósito de Venda",
	} as Record<string, string>;

	public async createUserController({
		auth,
		request,
		response,
	}: HttpContextContract) {
		try {
			const payload = await request.validate(CreateUserControllerValidator);
			await this.service.createUserController(
				auth.user?.system_id ?? -1,
				payload,
			);

			return response.noContent();
		} catch (e) {
			if (e instanceof ValidationException) {
				return response.unprocessableEntity({
					data: null,
					status: 422,
					title: "Entidade não processável",
					message: null,
					// @ts-expect-error
					validationErrors: e.messages.errors.reduce(
						(prev, curr) => {
							if (!prev[curr.field]) {
								prev[curr.field] = { errors: [] };
							}

							prev[curr.field].errors.push(
								curr.message.replace(
									"Campo",
									`Campo '${UsersController.intlMap[curr.field]}'`,
								),
							);

							return prev;
						},
						{} as Record<string, Record<string, string[]>>,
					),
				});
			}

			return response.badRequest({
				data: null,
				status: 400,
				title: "Requisição inválida",
				message: e.message.split(":").at(1).trim() ?? "Algo deu errado",
				validationErrors: {},
			});
		}
	}

	public async updateUserController({
		auth,
		request,
		response,
	}: HttpContextContract) {
		try {
			const payload = await request.validate(UpdateUserControllerValidator);
			await this.service.updateUserController(
				auth.user?.system_id ?? -1,
				payload,
			);

			return response.noContent();
		} catch (e) {
			if (e instanceof ValidationException) {
				return response.unprocessableEntity({
					data: null,
					status: 422,
					title: "Entidade não processável",
					message: null,
					// @ts-expect-error
					validationErrors: e.messages.errors.reduce(
						(prev, curr) => {
							if (!prev[curr.field]) {
								prev[curr.field] = { errors: [] };
							}

							prev[curr.field].errors.push(
								curr.message.replace(
									"Campo",
									`Campo '${UsersController.intlMap[curr.field]}'`,
								),
							);

							return prev;
						},
						{} as Record<string, Record<string, string[]>>,
					),
				});
			}

			return response.badRequest({
				data: null,
				status: 400,
				title: "Requisição inválida",
				message: e.message.split(":").at(1).trim() ?? "Algo deu errado",
				validationErrors: {},
			});
		}
	}

	public async fetchUserControllers({ auth, response }: HttpContextContract) {
		const data = await this.service.fetchUserControllers(
			auth.user?.system_id ?? -1,
		);

		return response.ok(data);
	}

	public async deleteUserController({
		auth,
		request,
		response,
	}: HttpContextContract) {
		try {
			await this.service.softDeleteUserController(auth.user?.system_id ?? -1, {
				id: request.param("id"),
			});

			return response.noContent();
		} catch (e) {
			return response.badRequest({
				data: null,
				status: 400,
				title: "Requisição inválida",
				message: e.message.split(":").at(1).trim() ?? "Algo deu errado",
				validationErrors: {},
			});
		}
	}

	public async disableUserControllerRole({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(DisableUserControllerRoleValidator);
		await this.service.disableUserControllerRole(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}
}
