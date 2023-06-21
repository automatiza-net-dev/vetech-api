import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { inject } from '@adonisjs/fold';
import AuthenticateThirdPartyValidator from 'App/Validators/ThirdParty/AuthenticateThirdPartyValidator';
import ThirdPartyService from 'App/Services/ThirdPartyService';

@inject()
export default class ThirdPartiesController {
  constructor(private readonly service: ThirdPartyService) {}

  public async authenticateSancla({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(AuthenticateThirdPartyValidator);

    const result = await this.service.authenticate(auth, 'Sanclá', payload);

    return response.ok(result);
  }

  public async authenticateVetech({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(AuthenticateThirdPartyValidator);

    const result = await this.service.authenticate(auth, 'Vetech', payload);

    return response.ok(result);
  }

  public async authenticateLiftOne({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(AuthenticateThirdPartyValidator);

    const result = await this.service.authenticate(auth, 'LiftOne', payload);

    return response.ok(result);
  }

  public async profile({ auth, response }: HttpContextContract) {
    const user = auth.use('tpApi').user!;

    return response.ok({
      id: user.id,
      key: user.key,
    });
  }
}
