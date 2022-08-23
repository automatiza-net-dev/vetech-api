import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import WeekDay from 'App/Models/shared/WeekDay';

export default class UpdateUnavailableDayValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    title: schema.string(),
    frequency: schema.array().members(schema.enum(Object.values(WeekDay), [])),
    startDate: schema.date({}),
    endDate: schema.date({}),
    startHour: schema.string({}),
    endHour: schema.string({}),
    active: schema.boolean([]),
  });

  public messages: CustomMessages = {};
}
