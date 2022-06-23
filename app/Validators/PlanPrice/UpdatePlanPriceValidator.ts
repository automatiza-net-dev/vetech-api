import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PlanPriceRecurrence } from 'App/Models/PlanPrice';

export default class UpdatePlanPriceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    plan_id: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'plans',
        column: 'id',
      }),
    ]),
    planPrice: schema.number([rules.unsigned()]),
    recurrence: schema.enum(Object.values(PlanPriceRecurrence), []),
    expirationDays: schema.number([rules.unsigned()]),
  });

  public messages: CustomMessages = {};
}
