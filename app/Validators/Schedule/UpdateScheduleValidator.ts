import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateScheduleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    scheduleServiceTypeId: schema.string({}, [
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
    holderId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'patients',
        column: 'id',
      }),
    ]),
    userId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    patientName: schema.string.optional({}, []),
    patientPhone: schema.string.optional({}, []),
    startHour: schema.date({}),
    endHour: schema.date({}),
    age: schema.number.optional([rules.unsigned()]),
    raceId: schema.string.optional({}),
    majorComplaint: schema.string.optional({}),
    ignoreOverlapping: schema.boolean.optional([]),
  });

  public messages: CustomMessages = {};
}
