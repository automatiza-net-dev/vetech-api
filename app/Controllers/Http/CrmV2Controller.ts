import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CrmV2Service from "App/Services/CrmV2Service";
import SharedService from "App/Services/SharedService";
import CreateKanbanBoardValidator from "App/Validators/CrmV2/CreateKanbanBoardValidator";
import UpdateKanbanBoardValidator from "App/Validators/CrmV2/UpdateKanbanBoardValidator";
import CreateOpportunityValidator from "App/Validators/CrmV2/CreateOpportunityValidator";
import TransferOpportunityValidator from "App/Validators/CrmV2/TransferOpportunityValidator";

@inject()
export default class CrmV2Controller {
	constructor(
		private sharedService: SharedService,
		private service: CrmV2Service,
	) {}

	public async searchSyncableOpportunities({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchSyncableOpportunities(
			authCtx,
			request.qs(),
		);

		return response.ok(result);
	}

	public async transferOpportunity({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(TransferOpportunityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.transferKanban(authCtx, payload);

		return response.ok(null);
	}

	public async createOpportunity({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateOpportunityValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.storeOpportunity(authCtx, payload);

		return response.ok(null);
	}

	public async searchActivities({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchActivities(authCtx, request.qs());

		return response.ok(result);
	}

	public async searchOpportunities({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchOpportunities(
			authCtx,
			request.qs(),
		);

		return response.ok(result);
	}

	public async searchKanbanOpportunities({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.searchKanbanOpportunities(
			authCtx,
			request.qs(),
		);

		return response.ok(result);
	}

	public async listKanbans({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const result = await this.service.listKanbans(authCtx, request.qs());

		return response.ok(result);
	}

	public async storeKanban({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateKanbanBoardValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.createKanban(authCtx, payload);

		return response.ok(null);
	}

	public async updateKanban({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateKanbanBoardValidator);
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.updateKanban(authCtx, payload);

		return response.ok(null);
	}

	public async deleteKanban({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		await this.service.deleteKanban(authCtx, { id: request.param("kanbanID") });

		return response.ok(null);
	}
}
