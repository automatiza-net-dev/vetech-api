import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateVariationGroupValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		description: schema.string({}, []),
		active: schema.boolean([]),
		options: schema.array().members(schema.string()),
	});

	public messages: CustomMessages = {};
}
