import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class OpenAttendanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    resume: schema.string(),
    protocol: schema.string(),
    scheduleServiceId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedule_service_types',
        column: 'id',
      }),
    ]),

    patientId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'patients',
        column: 'id',
      }),
    ]),
    scheduleId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedules',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
