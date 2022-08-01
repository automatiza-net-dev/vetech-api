import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender, PatientType } from 'App/Models/Patient';

export default class UpdatePatientValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    type: schema.enum(Object.values(PatientType), []),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    gender: schema.enum(Object.values(PatientGender), []),
    tags: schema.string({}, []),
    birthDate: schema.date({}),
    active: schema.boolean([]),
  });

  public messages: CustomMessages = {};
}
