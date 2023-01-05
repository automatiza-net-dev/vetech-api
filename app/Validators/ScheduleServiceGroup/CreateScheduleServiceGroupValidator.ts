import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { ScheduleServiceGroupType } from 'App/Models/ScheduleServiceGroup';

export default class CreateScheduleServiceGroupValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    type: schema.enum.optional(Object.values(ScheduleServiceGroupType)),
  });

  public messages: CustomMessages = {};
}
