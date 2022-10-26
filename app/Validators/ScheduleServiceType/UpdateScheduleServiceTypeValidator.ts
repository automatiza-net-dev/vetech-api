import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateScheduleServiceTypeValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    scheduleServiceGroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedule_service_groups',
        column: 'id',
      }),
    ]),
    productId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'products',
        column: 'id',
      }),
    ]),
    description: schema.string({}),
    reservedMinutes: schema.number([rules.unsigned()]),
    active: schema.boolean([]),
  });

  public messages: CustomMessages = {};
}
