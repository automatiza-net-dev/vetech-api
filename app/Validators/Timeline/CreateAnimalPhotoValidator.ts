import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalPhotoValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    photo: schema.file({
      extnames: ['jpg', 'gif', 'png', 'jpeg'],
    }),
    observation: schema.string.optional({}, []),
  });

  public messages: CustomMessages = {};
}
