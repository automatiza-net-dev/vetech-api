import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";

export default class IndexWhatsAppMessagesConfigValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		whatsappPhone: schema.string.optional({ trim: true }),
		platformIntegration: schema.string.optional({ trim: true }),
		status: schema.enum.optional(["Ativo", "Inativo", ""]),
		connectionStatus: schema.string.optional({ trim: true }),
	});

	public messages: CustomMessages = {};
}
