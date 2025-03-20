import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CrmV2Service from "App/Services/CrmV2Service";
import SharedService from "App/Services/SharedService";
import CreateKanbanBoardValidator from "App/Validators/CrmV2/CreateKanbanBoardValidator";
import UpdateKanbanBoardValidator from "App/Validators/CrmV2/UpdateKanbanBoardValidator";

@inject()
export default class CrmV2Controller {
	constructor(
		private sharedService: SharedService,
		private service: CrmV2Service,
	) {}

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
