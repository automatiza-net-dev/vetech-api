import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateAttendanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    realizedAt: schema.date.optional({}),
    createdAt: schema.date.optional({}),
    resume: schema.string.optional(),
    protocol: schema.string(),
    internalObservation: schema.string.optional(),
  });

  public messages: CustomMessages = {};
}
