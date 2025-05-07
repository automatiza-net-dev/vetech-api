import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { schema, CustomMessages } from "@ioc:Adonis/Core/Validator";

export default class CreateVariationValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		description: schema.string({}, []),
		options: schema.array().members(
			schema.object().members({
				id: schema.string.optional(),
				description: schema.string(),
			}),
		),
	});

	public messages: CustomMessages = {};
}
