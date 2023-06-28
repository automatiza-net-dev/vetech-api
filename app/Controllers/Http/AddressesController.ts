import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

import { inject } from '@adonisjs/fold';
import SharedService from 'App/Services/SharedService';
import AddressService from 'App/Services/AddressService';
import CreateAddressValidator from 'App/Validators/Address/CreateAddressValidator';
import UpdateAddressValidator from 'App/Validators/Address/UpdateAddressValidator';

@inject()
export default class AddressesController {
  constructor(
    private sharedService: SharedService,
    private service: AddressService,
  ) {}

  public async index({ params, auth, response }: HttpContextContract) {
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );
    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAddressValidator);

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  //   public async show({ auth, params, response }: HttpContextContract) {
  //     const result = await this.service.show(
  //       await this.sharedService.getAuthContext(auth),
  //       params.id,
  //     );

  //     return response.json(result);
  //   }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateAddressValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.json(result);
  }

  public async destroy({ params, auth, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
