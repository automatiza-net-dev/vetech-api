import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DreGroupService from "App/Services/DreGroupService";
import SharedService from "App/Services/SharedService";
import CreateDreGroupValidator from "App/Validators/DreGroup/CreateDreGroupValidator";
import UpdateDreGroupValidator from "App/Validators/DreGroup/UpdateDreGroupValidator";

@inject()
export default class DreGroupsController {
	constructor(
		private shared: SharedService,
		private service: DreGroupService,
	) {}

	// public async index(ctx: HttpContextContract) {
	// 	const authCtx = await this.shared.getAuthContext(ctx.auth);
	//
	// 	return ctx.response.ok(await this.service.store(authCtx));
	// }

	public async store(ctx: HttpContextContract) {
		const body = await ctx.request.validate(CreateDreGroupValidator);
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.created(await this.service.store(authCtx, body));
	}

	public async update(ctx: HttpContextContract) {
		const body = await ctx.request.validate(UpdateDreGroupValidator);
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		return ctx.response.ok(await this.service.update(authCtx, body));
	}

	public async destroy(ctx: HttpContextContract) {
		const authCtx = await this.shared.getAuthContext(ctx.auth);

		await this.service.delete(authCtx, { id: ctx.params.id });

		return ctx.response.noContent();
	}
}
