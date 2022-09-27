import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateHospitalizationClinicParameterValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    executedAt: schema.date.optional(),
    releasedAt: schema.date.optional(),
    value: schema.string(),
    resume: schema.string(),
    status: schema.string(),
    userId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    hospitalizationId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'hospitalizations', column: 'id' }),
    ]),
    clinicParameterId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'clinic_parameters', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
