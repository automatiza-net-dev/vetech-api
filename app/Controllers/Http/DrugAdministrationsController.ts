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
    const { unit_id } = this.sharedService.extractUser(auth);
    const result = await this.service.index(unit_id);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateDrugAdministrationValidator);

    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateDrugAdministrationValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
