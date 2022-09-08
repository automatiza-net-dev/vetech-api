import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePatientVaccineValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    vaccineId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'vaccines', column: 'id' }),
    ]),
    vaccineProtocolId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'vaccine_protocols', column: 'id' }),
    ]),
    patientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    scheduleId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'schedules', column: 'id' }),
    ]),
    userId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
