import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AddKitToBudgetValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    kitId: schema.number([rules.exists({ table: 'kits', column: 'id' })]),
    budgetId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'budgets', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
