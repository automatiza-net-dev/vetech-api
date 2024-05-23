import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ScheduleService from "App/Services/ScheduleService";
import SharedService from "App/Services/SharedService";
import CreateScheduleContactValidator from "App/Validators/Schedule/CreateScheduleContactValidator";
import CreateScheduleValidator from "App/Validators/Schedule/CreateScheduleValidator";
import RescheduleValidator from "App/Validators/Schedule/RescheduleValidator";
import UpdateScheduleSpecificStatusValidator from "App/Validators/Schedule/UpdateScheduleSpecificStatusValidator";
import UpdateScheduleValidator from "App/Validators/Schedule/UpdateScheduleValidator";
import { addDays } from "date-fns";
import { ValidationException } from "@ioc:Adonis/Core/Validator";
import UpdateScheduleStatusTypeValidator from "App/Validators/Schedule/UpdateScheduleStatusTypeValidator";

@inject()
export default class SchedulesController {
	constructor(
		private readonly service: ScheduleService,
		private readonly sharedService: SharedService,
	) {}

	public async homeContent({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const result = await this.service.homeContent(
			await this.sharedService.getAuthContext(auth),
			qs,
		);

		return response.ok(result);
	}

	public async homeContent_2({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const result = await this.service.homeContent_2(
			await this.sharedService.getAuthContext(auth),
			qs,
		);

		return response.ok(result);
	}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.index(unit_id, {
			patient: qs.patient,
			complaint: qs.complaint,
			pid: qs.pid,
		});

		return response.ok(result);
	}

	public async withSchedule({ auth, response }: HttpContextContract) {
		const result = await this.service.usersWithSchedule(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	public async returnableSchedules({
		auth,
		response,
		params,
	}: HttpContextContract) {
		const result = await this.service.returnableSchedules(
			await this.sharedService.getAuthContext(auth),
			params.patient,
		);

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.show(unit_id, params.id);

		return response.ok(result);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		try {
			const payload = await request.validate(CreateScheduleValidator);

			const result = await this.service.store(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
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
		const payload = await request.validate(UpdateScheduleValidator);
		const result = await this.service.update(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.ok(result);
	}

	public async reschedule({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		try {
			const payload = await request.validate(RescheduleValidator);
			const { user, unit_id } = this.sharedService.extractUser(auth);

			const result = await this.service.reschedule(
				unit_id,
				user,
				params.id,
				payload,
			);

			return response.ok(result);
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

	public async updateStatus({ auth, request, response }: HttpContextContract) {
		try {
			const payload = await request.validate(
				UpdateScheduleSpecificStatusValidator,
			);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const result = await this.service.updateScheduleStatusWithStaticValues(
				authCtx,
				payload,
			);

			return response.ok(result);
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

	public async updateStatusType({
		auth,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateScheduleStatusTypeValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const result = await this.service.updateScheduleStatusFromType(
				authCtx,
				payload,
			);

			return response.ok(result);
		});
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.destroy(unit_id, params.id);

		return response.noContent();
	}

	public async viewDisponibility({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.searchDisponibility({
			start: qs.start ?? new Date().toISOString(),
			end: qs.end ?? new Date().toISOString(),
			business: qs.business ?? unit_id,
			user: qs.user,
		});

		return response.ok(result);
	}

	public async viewServiceGroups({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const qs = request.qs();
		const result = await this.service.searchServices(unit_id, {
			start: qs.start ?? new Date().toISOString(),
			end: qs.end ?? new Date().toISOString(),
		});

		return response.ok(result);
	}

	public async userDailySchedule({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.userDailySchedule(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async simpleUserDailySchedule({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.simpleUserDailySchedule(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async usersWeeklySchedule({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.usersWeeklySchedule(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async userAppointments({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();

		const result = await this.service.userAppointments(
			unit_id,
			params.id,
			addDays(new Date(qs.date), 1),
		);

		return response.ok(result);
	}

	public async getScheduleStatusChanges({
		auth,
		params,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.getScheduleStatusChanges(
			authCtx,
			params.id,
		);

		return response.ok(result);
	}

	public async createContact({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateScheduleContactValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.createScheduleContact(authCtx, payload);

		return response.created(result);
	}

	public async getPatientSchedules({
		auth,
		params,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.getPatientSchedules(
			authCtx,
			params.patient,
		);

		return response.ok(result);
	}

	public async syncLateSchedules({ response }: HttpContextContract) {
		const result = await ScheduleService.RunSyncLateOrMissingSchedules();

		return response.ok(result);
	}
}
