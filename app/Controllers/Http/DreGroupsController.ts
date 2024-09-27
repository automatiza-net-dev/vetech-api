import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DreGroupService from "App/Services/DreGroupService";
import SharedService from "App/Services/SharedService";
import CreateDreGroupPlanningValidator from "App/Validators/DreGroup/CreateDreGroupPlanningValidator";
import CreateDreGroupValidator from "App/Validators/DreGroup/CreateDreGroupValidator";
import UpdateDreGroupPlanningValidator from "App/Validators/DreGroup/UpdateDreGroupPlanningValidator";
import UpdateDreGroupValidator from "App/Validators/DreGroup/UpdateDreGroupValidator";

@inject()
export default class DreGroupsController {
	constructor(
		private shared: SharedService,
		private service: DreGroupService,
	) {}

	public async search(ctx: HttpContextContract) {
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.ok(
			await this.service.search(authCtx, ctx.request.qs()),
		);
	}

	public async store(ctx: HttpContextContract) {
		const body = await ctx.request.validate(CreateDreGroupValidator);
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.created(await this.service.store(authCtx, body));
	}

	public async storePlanning(ctx: HttpContextContract) {
		const body = await ctx.request.validate(CreateDreGroupPlanningValidator);
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.created(
			await this.service.storePlanning(authCtx, body),
		);
	}

	public async update(ctx: HttpContextContract) {
		const body = await ctx.request.validate(UpdateDreGroupValidator);
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.ok(await this.service.update(authCtx, body));
	}

	public async updatePlanning(ctx: HttpContextContract) {
		const body = await ctx.request.validate(UpdateDreGroupPlanningValidator);
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.ok(await this.service.updatePlanning(authCtx, body));
	}

	public async destroy(ctx: HttpContextContract) {
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		await this.service.delete(authCtx, { id: ctx.params.id });

		return ctx.response.noContent();
	}

	public async destroyPlanning(ctx: HttpContextContract) {
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		await this.service.deletePlanning(authCtx, { id: ctx.params.id });

		return ctx.response.noContent();
	}
}
