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
import UpdateScheduleStatusTypeValidator from "App/Validators/Schedule/UpdateScheduleStatusTypeValidator";
import ReopenScheduleValidator from "App/Validators/Schedule/ReopenScheduleValidator";
import UpsertScheduleStatusValidator from "App/Validators/Schedule/UpsertScheduleStatusValidator";
import Schedule from "App/Models/Schedule";

@inject()
export default class SchedulesController {
	constructor(
		private readonly service: ScheduleService,
		private readonly sharedService: SharedService,
	) {}

	public async schedulesAttendances({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.schedulesAttendances(
			await this.sharedService.getAuthContext(auth),
			request.param("patientID"),
		);

		return response.ok(result);
	}

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
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateScheduleValidator);

			const result = await this.service.store(
				await this.sharedService.getAuthContext(auth),
				payload,
			);

			return response.created(result);
		});
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
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(RescheduleValidator);

			const result = await this.service.reschedule(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			if (result instanceof Schedule) {
				return response.ok(result);
			}

			return response.unprocessableEntity(result);
		});
	}

	public async reopenSchedule({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(ReopenScheduleValidator);

			const entity = await this.service.reopenSchedule(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(entity);
		});
	}

	public async upsertStatus({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpsertScheduleStatusValidator);

			const entity = await this.service.upsertStatus(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(entity);
		});
	}

	public async updateStatus({ auth, request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(
				UpdateScheduleSpecificStatusValidator,
			);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const result = await this.service.updateScheduleStatusWithStaticValues(
				authCtx,
				payload,
			);

			return response.ok(result);
		});
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
		await this.service.destroy(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

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
