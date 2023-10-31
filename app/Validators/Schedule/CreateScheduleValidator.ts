import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateScheduleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    scheduleServiceTypeId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedule_service_types',
        column: 'id',
      }),
    ]),
    startHour: schema.date({}),
    endHour: schema.date({}),
    ignoreBlocking: schema.boolean([]),

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
    scheduleOriginId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedules',
        column: 'id',
      }),
    ]),
    patientName: schema.string.optional({}, []),
    patientPhone: schema.string.optional({}, []),
    age: schema.number.optional([rules.unsigned()]),
    raceId: schema.string.optional({}),
    majorComplaint: schema.string.optional({}),
    ignoreOverlapping: schema.boolean.optional([]),
    onDuty: schema.boolean.optional([]),
  });

  public messages: CustomMessages = {};
}
