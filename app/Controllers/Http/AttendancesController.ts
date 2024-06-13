import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import AttendanceService from "App/Services/AttendanceService";
import SharedService from "App/Services/SharedService";
import OpenAttendanceValidator from "App/Validators/Attendances/OpenAttendanceValidator";
import UpdateAttendanceValidator from "App/Validators/Attendances/UpdateAttendanceValidator";
import { ValidationException } from "@ioc:Adonis/Core/Validator";

@inject()
export default class AttendancesController {
	constructor(
		protected readonly sharedService: SharedService,
		protected readonly service: AttendanceService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.index(unit_id, qs);

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.show(unit_id, params.id);

		return response.ok(result);
	}

	public async open({ auth, request, response }: HttpContextContract) {
		try {
			const payload = await request.validate(OpenAttendanceValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const res = await this.service.open(authCtx, payload);

			return response.ok(res);
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
									`Campo '${SharedService.intlMap[curr.field]}'`,
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

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		try {
			const payload = await request.validate(UpdateAttendanceValidator);

			const r = await this.service.update(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(r);
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
									`Campo '${SharedService.intlMap[curr.field]}'`,
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

	public async close({ auth, params, response }: HttpContextContract) {
		try {
			await this.service.close(
				await this.sharedService.getAuthContext(auth),
				params.id,
			);

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
}
