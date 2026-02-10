import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateWhatsAppMessagesConfigValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tintimClientId: schema.string({ trim: true }),
    whatsappPhone: schema.string({ trim: true }),
    platformIntegration: schema.string({ trim: true }),
  });

  public messages: CustomMessages = {};
}
