import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateUserValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		systemId: schema.number([rules.exists({ table: "systems", column: "id" })]),

		name: schema.string({}),
		email: schema.string({}),
		password: schema.string({}, [rules.confirmed()]),
		document: schema.string.optional({}, [
			rules.unique({ table: "users", column: "document" }),
			rules.documento(),
		]),
		phone: schema.string.optional({}, [rules.maxLength(20)]),
		postalCode: schema.string.optional({}),
		address: schema.string.optional({}),
		number: schema.string.optional({}),
		complement: schema.string.optional({}),
		district: schema.string.optional({}),
		city: schema.string.optional({}),
		state: schema.string.optional({}),
		active: schema.boolean.optional([]),
		licensingJob: schema.string.optional({}),
		onDuty: schema.boolean.optional([]),
	});
	public messages: CustomMessages = {};
}
