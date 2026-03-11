import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateMultipleExpirationDatesValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    items: schema.array().members(
      schema.object().members({
        id: schema.string({}, [rules.uuid(), rules.exists({ table: "finances", column: "id" })]),
        expirationDate: schema.date(),
      }),
    ),
  });

  public messages: CustomMessages = {};
}
