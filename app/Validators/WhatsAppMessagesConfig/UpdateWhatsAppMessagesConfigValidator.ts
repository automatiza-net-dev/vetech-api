import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateWhatsAppMessagesConfigValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    whatsappPhone: schema.string.optional({ trim: true }),
    platformIntegration: schema.string.optional({ trim: true }),
    connectionStatus: schema.string.optional({ trim: true }),
    active: schema.boolean.optional(),
  });

  public messages: CustomMessages = {};
}
