import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import OpportunityService from "App/Services/OpportunityService";
import SharedService from "App/Services/SharedService";
import CancelOpportunityActivityValidator from "App/Validators/Opportunity/CancelOpportunityActivityValidator";
import CloseLoosingOpportunityValidator from "App/Validators/Opportunity/CloseLoosingOpportunityValidator";
import CloseWinningOpportunityValidator from "App/Validators/Opportunity/CloseWinningOpportunityValidator";
import CreateOpportunityActivityValidator from "App/Validators/Opportunity/CreateOpportunityActivityValidator";
import CreateOpportunityFromScheduleValidator from "App/Validators/Opportunity/CreateOpportunityFromScheduleValidator";
import CreateOpportunityValidator from "App/Validators/Opportunity/CreateOpportunityValidator";
import SyncScheduleValidator from "App/Validators/Opportunity/SyncScheduleValidator";
import UpdateOpportunityActivityValidator from "App/Validators/Opportunity/UpdateOpportunityActivityValidator";
import UpdateOpportunityStatusValidator from "App/Validators/Opportunity/UpdateOpportunityStatusValidator";
import UpdateOpportunityUserValidator from "App/Validators/Opportunity/UpdateOpportunityUserValidator";
import UpdateOpportunityValidator from "App/Validators/Opportunity/UpdateOpportunityValidator";
import UpdatePatientValidator from "App/Validators/Opportunity/UpdatePatientValidator";

@inject()
export default class OpportunitiesController {
	constructor(
		private sharedService: SharedService,
		private service: OpportunityService,
	) {}

	public async show({ params, response, auth }: HttpContextContract) {
		const result = await this.service.showOpportunity(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(result);
	}

	public async search({ request, response, auth }: HttpContextContract) {
		const result = await this.service.searchOpportunities(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchActivities({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const result = await this.service.searchActivities(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchCompleteKanban({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const result = await this.service.searchCompleteKanbanOpportunities(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchKanban({ request, response, auth }: HttpContextContract) {
		const result = await this.service.searchKanbanOpportunities(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchKanbanActivities({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const result = await this.service.searchKanbanOpportunityActivities(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async store({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CreateOpportunityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.store(authCtx, payload);

		return response.created();
	}

	public async storeFromSchedule({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(
			CreateOpportunityFromScheduleValidator,
		);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.storeFromSchedule(authCtx, payload);

		return response.created();
	}

	public async update({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateOpportunityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.update(authCtx, params.id, payload);

		return response.noContent();
	}

	public async closeWinning({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(CloseWinningOpportunityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.closeWinningOpportunity(authCtx, params.id, payload);

		return response.noContent();
	}

	public async closeLoosing({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(CloseLoosingOpportunityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.closeLoosingOpportunity(authCtx, params.id, payload);

		return response.noContent();
	}

	public async reopen({ response, auth, params }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.reopenOpportunity(authCtx, params.id);

		return response.ok(result);
	}

	public async updateStatus({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateOpportunityStatusValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateStatus(authCtx, params.id, payload);

		return response.noContent();
	}

	public async updateUser({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateOpportunityUserValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateUser(authCtx, params.id, payload);

		return response.noContent();
	}

	public async createActivity({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(CreateOpportunityActivityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.addActivity(authCtx, payload);

		return response.noContent();
	}

	public async executeActivity({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(CancelOpportunityActivityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.executeActivity(authCtx, params.id, payload);

		return response.noContent();
	}

	public async reopenActivity({ response, auth, params }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.reopenActivity(authCtx, params.id);

		return response.noContent();
	}

	public async updateActivity({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateOpportunityActivityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateActivity(authCtx, payload);

		return response.noContent();
	}

	public async cancelActivity({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const payload = await request.validate(CancelOpportunityActivityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.cancelActivity(authCtx, params.id, payload);

		return response.noContent();
	}

	public async excludeActivity({
		response,
		auth,
		params,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.excludeActivity(authCtx, params.id);

		return response.noContent();
	}

	public async searchSyncableOpportunities({
		response,
		auth,
		request,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchSyncableOpportunities(
			authCtx,
			request.qs(),
		);
		return response.ok(result);
	}

	public async searchSyncableSchedules({
		response,
		auth,
		request,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchSyncableSchedules(
			authCtx,
			request.qs(),
		);
		return response.ok(result);
	}

	public async syncSchedule({ response, auth, request }: HttpContextContract) {
		const payload = await request.validate(SyncScheduleValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.syncSchedules(authCtx, payload);

		return response.noContent();
	}

	public async excludeOpportunity({
		response,
		auth,
		params,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.exclude(authCtx, params.id);

		return response.noContent();
	}

	public async updateOpportunityPatient({
		response,
		auth,
		request,
	}: HttpContextContract) {
		const payload = await request.validate(UpdatePatientValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateOpportunityPatient(authCtx, payload);

		return response.noContent();
	}
}
