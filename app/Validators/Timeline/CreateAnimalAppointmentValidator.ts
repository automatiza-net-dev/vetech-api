import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalAppointmentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    realizedAt: schema.date({}),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    scheduleServiceId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedule_service_types',
        column: 'id',
      }),
    ]),
    resume: schema.string({}, []),
    protocol: schema.string({}, []),
  });

  public messages: CustomMessages = {};
}
