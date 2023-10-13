// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HospitalizationOccurrencesService from 'App/Services/HospitalizationOccurrencesService';
import SharedService from 'App/Services/SharedService';
import CreateHospitalizationOccurrenceAttachmentValidator from 'App/Validators/HospitalizationOccurrence/CreateHospitalizationOccurrenceAttachmentValidator';
import CreateHospitalizationOccurrenceValidator from 'App/Validators/HospitalizationOccurrence/CreateHospitalizationOccurrenceValidator';
import UpdateHospitalizationOccurrenceValidator from 'App/Validators/HospitalizationOccurrence/UpdateHospitalizationOccurrenceValidator';

@inject()
export default class HospitalizationOccurrencesController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: HospitalizationOccurrencesService,
  ) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateHospitalizationOccurrenceValidator,
    );

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async storeAttachment({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      CreateHospitalizationOccurrenceAttachmentValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.storeAttachments(unit_id, payload);

    return response.noContent();
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      UpdateHospitalizationOccurrenceValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.delete(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }

  public async destroyAttachment({
    auth,
    params,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.deleteAttachment(unit_id, params.id, params.attachment);

    return response.noContent();
  }
}
