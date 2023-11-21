import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import IssuedFiscalDocumentService from 'App/Services/IssuedFiscalDocumentService';
import SharedService from 'App/Services/SharedService';

@inject()
export default class IssuedFiscalDocumentsController {
  constructor(
    private readonly service: IssuedFiscalDocumentService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      unit: qs.unit,
      type: qs.type,
      description: qs.description,
      model: qs.model,
      series: qs.series,
      sequence: qs.sequence,
    });

    return response.ok(result);
  }

  public async search({ auth, request, response }: HttpContextContract) {
    const result = await this.service.search(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }
}
