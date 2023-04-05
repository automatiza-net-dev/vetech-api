import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateEconomicGroupValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    fantasyName: schema.string({}),
    companyName: schema.string({}),
    document: schema.string({}),
    responsibleEmail: schema.string({}, [
      rules.email(),
      rules.unique({ table: 'economic_groups', column: 'responsible_email' }),
    ]),
    responsiblePhone: schema.string({}),
  });

  public messages: CustomMessages = {};
}
