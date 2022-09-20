import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    subgroupId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    name: schema.string({}, []),
    description: schema.string.optional({}, []),
    type: schema.string.optional({}, []),
    ownLaboratory: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
