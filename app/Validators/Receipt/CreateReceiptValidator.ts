import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateReceiptValidator {
  constructor(protected ctx: HttpContextContract) {}

  /*
   * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
   *
   * For example:
   * 1. The username must be of data type string. But then also, it should
   *    not contain special characters or numbers.
   *    ```
   *     schema.string({}, [ rules.alpha() ])
   *    ```
   *
   * 2. The email must be of data type string, formatted as a valid
   *    email. But also, not used by any other user.
   *    ```
   *     schema.string({}, [
   *       rules.email(),
   *       rules.unique({ table: 'users', column: 'email' }),
   *     ])
   *    ```
   */
  public schema = schema.create({
    supplierId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    dailyMovementId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_movements', column: 'id' }),
    ]),
    dailyCashierId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_cashiers', column: 'id' }),
    ]),
    reversalUserId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'reasons', column: 'id' }),
    ]),
    reversalReasonId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),

    receiptDate: schema.date(),
    otherValue: schema.number.optional(),
    additionalInformation: schema.string.optional(),
    reversalObservation: schema.string.optional(),
    reversedAt: schema.date.optional(),

    items: schema.array().members(
      schema.object().members({
        productVariationId: schema.string({ trim: true }, [
          rules.uuid(),
          rules.exists({ table: 'product_variations', column: 'id' }),
        ]),
        quantity: schema.number([]),
        costValue: schema.number([]),
        unitaryValue: schema.number([]),
        discountValue: schema.number([]),
      }),
    ),
  });

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
  public messages: CustomMessages = {};
}
