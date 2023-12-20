import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CancelBudgetValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		reasonId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "reasons", column: "id" }),
		]),
		finishedAt: schema.date(),
		canceledObservation: schema.string(),
		internalObservation: schema.string.optional({}, []),
	});

	public messages: CustomMessages = {};
}
