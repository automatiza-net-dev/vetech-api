import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator';

export default class CreateOpportunityValidator {
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
    businessUnitId: schema.string.optional([
      rules.uuid(),
      rules.exists({ table: 'business_units', column: 'id' }),
    ]),
    userId: schema.string([
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    clientId: schema.string([
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    contactId: schema.string([
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    statusId: schema.number([
      rules.exists({ table: 'crm_statuses', column: 'id' }),
    ]),
    contactDate: schema.date(),
    contactTypeId: schema.number([
      rules.exists({ table: 'contact_types', column: 'id' }),
    ]),
    contactSubjectId: schema.number([
      rules.exists({ table: 'contact_subjects', column: 'id' }),
    ]),
    originId: schema.string([
      rules.uuid(),
      rules.exists({ table: 'client_origins', column: 'id' }),
    ]),
    description: schema.string(),
    observation: schema.string.optional(),
    value: schema.number(),
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
