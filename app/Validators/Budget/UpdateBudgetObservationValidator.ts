import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateBudgetObservationValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		observation: schema.string(),
		internalObservation: schema.string(),
	});

	public messages: CustomMessages = {};
}
