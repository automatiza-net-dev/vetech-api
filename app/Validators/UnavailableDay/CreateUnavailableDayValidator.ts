import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import WeekDay from 'App/Models/shared/WeekDay';

export default class CreateUnavailableDayValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    title: schema.string(),
    userId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    frequency: schema.enum(Object.values(WeekDay), []),
    startDate: schema.date({}),
    endDate: schema.date({}),
    startHour: schema.string({}),
    endHour: schema.string({}),
  });

  public messages: CustomMessages = {};
}
