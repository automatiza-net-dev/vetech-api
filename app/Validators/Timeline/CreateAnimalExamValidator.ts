import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    name: schema.string({}, []),
    realizedAt: schema.date({}),
    requesterId: schema.string({}, [rules.uuid()]),
    technicianId: schema.string({}, [rules.uuid()]),
    description: schema.string({}, []),
    attachments: schema.array().members(schema.file({}, [])),
  });

  public messages: CustomMessages = {};
}
