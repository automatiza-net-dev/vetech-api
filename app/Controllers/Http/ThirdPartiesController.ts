import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { inject } from '@adonisjs/fold';
import AuthenticateThirdPartyValidator from 'App/Validators/ThirdParty/AuthenticateThirdPartyValidator';
import ThirdPartyService from 'App/Services/ThirdPartyService';

@inject()
export default class ThirdPartiesController {
  constructor(private readonly service: ThirdPartyService) {}

  public async authenticate({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(AuthenticateThirdPartyValidator);

    const result = await this.service.authenticate(auth, payload);

    return response.ok(result);
  }
}
