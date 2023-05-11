import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { TutorResidences } from 'App/Models/PatientTutor';

export default class CreatePatientSupplierValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    name: schema.string({}),
    email: schema.string.optional({}, [rules.email()]),
    cellphone: schema.string.optional({}, []),
    document: schema.string.optional({}, []),

    stateInscription: schema.string.optional({}),
    residence: schema.enum.optional(TutorResidences),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    tags: schema.string.optional({}, []),
    birthDate: schema.date.optional({}),
    inscription: schema.string.optional({}, []),
    corporateName: schema.string.optional({}, []),
    telephone: schema.string.optional({}, []),
    messagePersonName: schema.string.optional({}, []),
    messagePersonPhone: schema.string.optional({}, []),
    postalCode: schema.string.optional({}, []),
    street: schema.string.optional({}, []),
    number: schema.string.optional({}, []),
    complement: schema.string.optional({}, []),
    district: schema.string.optional({}, []),
    city: schema.string.optional({}, []),
    state: schema.string.optional({}, []),
    cityCode: schema.string.optional({}),
  });

  public messages: CustomMessages = {};
}
