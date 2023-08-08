import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import IpAccessControlService from 'App/Services/IpAccessControlService';
import SharedService from 'App/Services/SharedService';
import StoreIpAccessControlValidator from 'App/Validators/IpAccessControl/StoreIpAccessControlValidator';

@inject()
export default class IpAccessControlsController {
  constructor(
    private sharedService: SharedService,
    private readonly service: IpAccessControlService,
  ) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(StoreIpAccessControlValidator);

    await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.noContent();
  }
}
