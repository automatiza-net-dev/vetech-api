import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateTreatmentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    billId: schema.string.optional([
      rules.exists({ table: 'bills', column: 'id' }),
    ]),
    clientId: schema.string([
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    sellerId: schema.string([rules.exists({ table: 'users', column: 'id' })]),

    emissionDate: schema.date(),
  });

  public messages: CustomMessages = {};
}
