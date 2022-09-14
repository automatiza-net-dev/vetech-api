import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import DrugAdministrationService from 'App/Services/DrugAdministrationService';
import CreateDrugAdministrationValidator from 'App/Validators/DrugAdministration/CreateDrugAdministrationValidator';
import UpdateDrugAdministrationValidator from 'App/Validators/DrugAdministration/UpdateDrugAdministrationValidator';

@inject()
export default class DrugAdministrationsController {
  constructor(private readonly service: DrugAdministrationService) {}

  public async index({ response }: HttpContextContract) {
    const result = await this.service.index();

    return response.ok(result);
  }

  public async show({ params, response }: HttpContextContract) {
    const result = await this.service.show(params.id);

    return response.ok(result);
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateDrugAdministrationValidator);

    const result = await this.service.store(payload);

    return response.created(result);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateDrugAdministrationValidator);

    const result = await this.service.update(params.id, payload);

    return response.ok(result);
  }

  public async destroy({ params, response }: HttpContextContract) {
    await this.service.destroy(params.id);

    return response.noContent();
  }
}
