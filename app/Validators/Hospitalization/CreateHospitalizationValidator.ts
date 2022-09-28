import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { HospitalizationStatus } from 'App/Models/Hospitalization';

export default class CreateHospitalizationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tutorId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    patientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    bedId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'beds', column: 'id' }),
    ]),
    userId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    type: schema.number(),
    complaint: schema.string(),
    risk: schema.number.optional(),
    expectedDischarge: schema.date.optional(),
    diagnosis: schema.string.optional(),
    prognosis: schema.string.optional(),
    status: schema.enum.optional(Object.values(HospitalizationStatus)),
  });

  public messages: CustomMessages = {};
}
