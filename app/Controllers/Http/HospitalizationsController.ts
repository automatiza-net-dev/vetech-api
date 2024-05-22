import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import HospitalizationService from "App/Services/HospitalizationService";
import SharedService from "App/Services/SharedService";
import CreateHospitalizationValidator from "App/Validators/Hospitalization/CreateHospitalizationValidator";
import UpdateHospitalizationValidator from "App/Validators/Hospitalization/UpdateHospitalizationValidator";

@inject()
export default class HospitalizationsController {
	constructor(
		private readonly service: HospitalizationService,
		private readonly sharedService: SharedService,
	) {}

	public async parsedIndex({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const result = await this.service.parsedIndex(unit_id, qs);

		return response.ok(result);
	}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const entity = await this.service.index(unit_id, {
			bed: qs.bed,
			patient: qs.patient,
			tutor: qs.tutor,
		});

		return response.ok(entity);
	}

	public async completedIndex({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const entity = await this.service.completedIndex(unit_id, {
			bed: qs.bed,
			patient: qs.patient,
			tutor: qs.tutor,
		});

		return response.ok(entity);
	}

	public async showTimeline({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const timeline = await this.service.timeline(unit_id, params.id);

		return response.ok(timeline);
	}

	public async showPatientTimeline({ params, response }: HttpContextContract) {
		const timeline = await this.service.patientTimeline(params.id);

		return response.ok(timeline);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		console.log("here");
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateHospitalizationValidator);
			const authCtx = await this.sharedService.getAuthContext(auth);

			const entity = await this.service.store(authCtx, payload);

			return response.created(entity);
		});
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const hospitalization = await this.service.show(unit_id, params.id);

		return response.ok(hospitalization);
	}

	public async complete({ auth, params, response }: HttpContextContract) {
		const { unit_id, user } = this.sharedService.extractUser(auth);

		await this.service.completeHospitalization(unit_id, params.id, user);

		return response.noContent();
	}

	public async getScheduling({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const scheduling = await this.service.getScheduling(unit_id, params.id);

		return response.ok(scheduling);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateHospitalizationValidator);

			const entity = await this.service.update(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(entity);
		});
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.destroy(unit_id, params.id);

		return response.noContent();
	}

	public async getHospitalizationScheduling({
		auth,
		params,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.getHospitalizationScheduling(
			authCtx,
			params.id,
		);

		return response.ok(result);
	}
}
