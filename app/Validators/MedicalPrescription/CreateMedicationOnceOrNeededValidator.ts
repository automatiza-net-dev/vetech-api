import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateMedicationOnceOrNeededValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    prescriptionUnitId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'units',
        column: 'id',
      }),
    ]),
    dose: schema.number(),
    drugAdministrationId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'drug_administrations',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
