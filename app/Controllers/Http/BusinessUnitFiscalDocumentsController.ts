import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnitFiscalDocumentService from 'App/Services/BusinessUnitFiscalDocumentService';
import SharedService from 'App/Services/SharedService';
import CreateBusinessUnitFiscalDocumentValidator from 'App/Validators/FiscalDocument/CreateBusinessUnitFiscalDocumentValidator';

@inject()
export default class BusinessUnitFiscalDocumentsController {
  constructor(
    private readonly service: BusinessUnitFiscalDocumentService,
    private readonly sharedService: SharedService,
  ) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateBusinessUnitFiscalDocumentValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }
}
