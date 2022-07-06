import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateUnavailableDayValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    startHour: schema.date({}),
    endHour: schema.date({}),
  });

  public messages: CustomMessages = {};
}
