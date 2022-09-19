import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
} from 'App/Models/MedicalPrescription';

export default class CreateFluidRecurrentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    frequencyInterval: schema.number(),
    frequencyUnit: schema.enum(Object.values(MedicalPrescriptionFrequencyUnit)),
    frequencyQuantity: schema.number(),
    frequencyQuantityUnit: schema.enum(
      Object.values(MedicalPrescriptionFrequencyQuantityUnit),
    ),
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
    fluidSet: schema.enum(Object.values(MedicalPrescriptionFluidSet)),
    fluidSpeed: schema.number(),
    fluidUnitId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'units',
        column: 'id',
      }),
    ]),
    suplement: schema.string({}),
  });

  public messages: CustomMessages = {};
}
