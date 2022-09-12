import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    subgroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    name: schema.string({}, []),
    description: schema.string({}, []),
    active: schema.boolean([]),
    type: schema.string({}, []),
    ownLaboratory: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
