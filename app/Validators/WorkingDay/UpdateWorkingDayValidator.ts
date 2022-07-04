import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import WeekDay from 'App/Models/shared/WeekDay';

export default class UpdateWorkingDayValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    dayOfWeek: schema.enum(Object.values(WeekDay), []),
    startHour: schema.date({}),
    endHour: schema.date({}),
  });

  public messages: CustomMessages = {};
}
