import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import WeekDay from 'App/Models/shared/WeekDay';

export default class CreateWorkingDayValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    userId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    dayOfWeek: schema.enum(Object.values(WeekDay), []),
    startHour: schema.date({}),
    endHour: schema.date({}),
  });

  public messages: CustomMessages = {};
}
