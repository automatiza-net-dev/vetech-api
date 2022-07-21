import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateAttendanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    schedule: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'schedules',
        column: 'id',
      }),
    ]),
    status: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'attendance_statuses',
        column: 'id',
      }),
    ]),
    complaint: schema.string({}, []),
    clinicalExamination: schema.string({}, []),
    startDate: schema.date({}, []),
    endDate: schema.date({}, []),
  });

  public messages: CustomMessages = {};
}
