import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class RescheduleValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		startHour: schema.date({}),
		endHour: schema.date({}),
		reasonId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "reasons", column: "id" }),
		]),
		userId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "users", column: "id" }),
		]),
		observation: schema.string.optional({}, [rules.maxLength(255)]),
		ignoreBlocking: schema.boolean.optional(),
		ignoreOverlapping: schema.boolean.optional(),
	});

	public messages: CustomMessages = {};
}
