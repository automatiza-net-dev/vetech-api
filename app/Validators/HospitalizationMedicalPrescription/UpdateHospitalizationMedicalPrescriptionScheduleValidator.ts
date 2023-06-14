import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema, rules } from '@ioc:Adonis/Core/Validator';
import { HospitalizationSchedulingStatus } from 'App/Models/HospitalizationMedicalPrescriptionScheduling';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';

export default class UpdateHospitalizationMedicalPrescriptionScheduleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    executionUserId: schema.string([
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    type: schema.enum(Object.values(MedicalPrescriptionType)),
    frequency: schema.enum(Object.values(MedicalPrescriptionFrequency)),
    scheduledAt: schema.date.optional(),
    executedAt: schema.date.optional(),
    description: schema.string.optional(),
    resume: schema.string.optional(),
    status: schema.enum(Object.values(HospitalizationSchedulingStatus)),
  });

  public messages: CustomMessages = {};
}
