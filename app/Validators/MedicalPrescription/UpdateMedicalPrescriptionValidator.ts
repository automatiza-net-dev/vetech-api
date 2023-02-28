import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';

export default class UpdateMedicalPrescriptionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    type: schema.enum(Object.values(MedicalPrescriptionType)),
    prescribedAt: schema.date(),
    frequency: schema.enum(Object.values(MedicalPrescriptionFrequency)),
    description: schema.string(),
    resume: schema.string(),
  });

  public messages: CustomMessages = {};
}
