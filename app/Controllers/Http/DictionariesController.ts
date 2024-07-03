import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

import { inject } from "@adonisjs/fold";
import DictionaryService from "App/Services/DictionaryService";

@inject()
export default class DictionariesController {
	constructor(private service: DictionaryService) {}

	public async index(ctx: HttpContextContract) {
		ctx.response.header["Cache-Control"] = "max-age=60";

		return ctx.response.ok(await this.service.index());
	}
}
