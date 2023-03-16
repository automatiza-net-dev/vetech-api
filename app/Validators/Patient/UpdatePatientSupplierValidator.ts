import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { TutorResidences } from 'App/Models/PatientTutor';

export default class UpdatePatientSupplierValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    email: schema.string({}, [rules.email()]),
    cellphone: schema.string({}, []),
    document: schema.string({}, []),

    stateInscription: schema.string.optional({}),
    residence: schema.enum.optional(TutorResidences),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    tags: schema.string.optional({}, []),
    birthDate: schema.date.optional({}),
    inscription: schema.string.optional({}, []),
    corporate_name: schema.string.optional({}, []),
    telephone: schema.string.optional({}, []),
    message_person_name: schema.string.optional({}, []),
    message_person_phone: schema.string.optional({}, []),
    postal_code: schema.string.optional({}, []),
    street: schema.string.optional({}, []),
    number: schema.string.optional({}, []),
    complement: schema.string.optional({}, []),
    district: schema.string.optional({}, []),
    city: schema.string.optional({}, []),
    state: schema.string.optional({}, []),
    cityCode: schema.string.optional({}),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
