import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateLicenceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    business_unit_id: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'business_units',
        column: 'id',
      }),
    ]),
    expiration_date: schema.date({}),
  });

  public messages: CustomMessages = {};
}
