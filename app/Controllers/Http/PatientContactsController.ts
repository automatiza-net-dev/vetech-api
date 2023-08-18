import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

import { inject } from '@adonisjs/fold';
import SharedService from 'App/Services/SharedService';
import PatientContactService from 'App/Services/PatientContactService';
import CreatePatientContactValidator from 'App/Validators/PatientContact/CreatePatientContactValidator';
import UpdatePatientContactValidator from 'App/Validators/PatientContact/UpdatePatientContactValidator';
import CreateBatchPatientContactValidator from 'App/Validators/PatientContact/CreateBatchPatientContactValidator';
import UpdateBatchPatientContactValidator from 'App/Validators/PatientContact/UpdateBatchPatientContactValidator';

@inject()
export default class PatientContactsController {
  constructor(
    private sharedService: SharedService,
    private service: PatientContactService,
  ) {}

  public async index({ params, auth, response }: HttpContextContract) {
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );
    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientContactValidator);

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async batchStore({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateBatchPatientContactValidator);

    const result = await this.service.batchStore(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  // public async show({ auth, params, response }: HttpContextContract) {
  //   const result = await this.service.show(
  //     await this.sharedService.getAuthContext(auth),
  //     params.id,
  //   );

  //   return response.json(result);
  // }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdatePatientContactValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.json(result);
  }

  public async batchUpdate({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateBatchPatientContactValidator);

    const result = await this.service.batchUpdate(
      await this.sharedService.getAuthContext(auth),
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
