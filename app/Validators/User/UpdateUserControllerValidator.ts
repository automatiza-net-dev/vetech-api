import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

export default class UpdateUserControllerValidator {
  constructor(protected ctx: HttpContextContract) {}

  getUserId() {
    return this.ctx.request.body().id;
  }

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
    id: schema.string({}, [rules.exists({ table: 'users', column: 'id' })]),
    name: schema.string(),
    email: schema.string({}, [
      rules.unique({
        table: 'users',
        column: 'email',
        whereNot: { id: this.getUserId() },
      }),
    ]),
    document: schema.string(),
    password: schema.string(),
    units: schema.array().members(
      schema.object().members({
        businessUnitId: schema.string([
          rules.exists({ table: 'business_units', column: 'id' }),
        ]),
        roleId: schema.number([rules.exists({ table: 'roles', column: 'id' })]),
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
