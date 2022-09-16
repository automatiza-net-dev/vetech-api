import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateVaccineCalendarValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    schedulingDate: schema.date.optional(),
    applicationDate: schema.date.optional(),
    productId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'products',
        column: 'id',
      }),
    ]),
    dose: schema.number([rules.unsigned()]),
    laboratory: schema.string.optional(),
    batch: schema.string.optional(),
  });

  public messages: CustomMessages = {};
}
