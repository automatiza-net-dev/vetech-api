import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class WhatsAppWebhookValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    account: schema.object().members({
      code: schema.string([rules.uuid()]),
      name: schema.string(),
    }),
    source: schema.string(),
    name: schema.string.optional(),
    phone: schema.string(),
    phone_e164: schema.string(),
    event_type: schema.string(),
    first_interaction_at: schema.string(),
    last_interaction_at: schema.string(),
    created: schema.string(),
    created_isoformat: schema.string(),
    visit: schema.object.optional().members({
      name: schema.string(),
    }),
  });

  public messages: CustomMessages = {
    "account.code.uuid": "O código da conta deve ser um UUID válido",
    "phone.string": "O telefone deve ser uma string",
    "name.string": "O nome deve ser uma string",
  };
}
