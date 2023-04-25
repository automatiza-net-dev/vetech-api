import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AddKitToBillValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    kitId: schema.number([rules.exists({ table: 'kits', column: 'id' })]),
    billId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'bills', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
