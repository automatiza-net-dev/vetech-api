import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';

export default class UpdateHospitalizationMedicalPrescriptionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    hospitalizationId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'hospitalizations', column: 'id' }),
    ]),
    userId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    type: schema.enum(Object.values(MedicalPrescriptionType)),
    prescribedAt: schema.date(),
    executionStart: schema.date(),
    frequency: schema.enum(Object.values(MedicalPrescriptionFrequency)),
    description: schema.string(),
    observationOnExecution: schema.string.optional(),
    resume: schema.string(),
    volume: schema.string(),
  });

  public messages: CustomMessages = {};
}
