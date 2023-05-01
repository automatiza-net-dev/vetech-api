import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import DrugAdministrationService from 'App/Services/DrugAdministrationService';
import SharedService from 'App/Services/SharedService';
import CreateDrugAdministrationValidator from 'App/Validators/DrugAdministration/CreateDrugAdministrationValidator';
import UpdateDrugAdministrationValidator from 'App/Validators/DrugAdministration/UpdateDrugAdministrationValidator';

@inject()
export default class DrugAdministrationsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: DrugAdministrationService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateDrugAdministrationValidator);

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateDrugAdministrationValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
