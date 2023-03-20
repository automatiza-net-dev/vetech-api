import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnitFiscalDocumentService from 'App/Services/BusinessUnitFiscalDocumentService';
import SharedService from 'App/Services/SharedService';
import AuthorizeBusinessUnitFiscalDocumentValidator from 'App/Validators/FiscalDocument/AuthorizeBusinessUnitFiscalDocumentValidator';
import AuthorizeBusinessUnitNfseFiscalDocumentValidator from 'App/Validators/FiscalDocument/AuthorizeBusinessUnitNfseFiscalDocumentValidator';
import CancelBusinessUnitFiscalDocumentValidator from 'App/Validators/FiscalDocument/CancelBusinessUnitFiscalDocumentValidator';
import CorrectBusinessUnitFiscalDocumentValidator from 'App/Validators/FiscalDocument/CorrectBusinessUnitFiscalDocumentValidator';
import CreateBusinessUnitFiscalDocumentValidator from 'App/Validators/FiscalDocument/CreateBusinessUnitFiscalDocumentValidator';
import DisableBusinessUnitFiscalDocumentValidator from 'App/Validators/FiscalDocument/DisableBusinessUnitFiscalDocumentValidator';

@inject()
export default class BusinessUnitFiscalDocumentsController {
  constructor(
    private readonly service: BusinessUnitFiscalDocumentService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, qs);

    return response.ok(result);
  }

  public async search({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.search(unit_id, qs);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateBusinessUnitFiscalDocumentValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }

  public async authorize({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      AuthorizeBusinessUnitFiscalDocumentValidator,
    );
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.authorize(unit_id, user, payload);

    return response.created(result);
  }

  public async authorizeNfse({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      AuthorizeBusinessUnitNfseFiscalDocumentValidator,
    );
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.authorizeNfse(unit_id, user, payload);

    return response.created(result);
  }

  public async forceUpdate({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.updateFromFocus(unit_id, params.id);

    return response.noContent();
  }

  public async cancel({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CancelBusinessUnitFiscalDocumentValidator,
    );
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.cancel(unit_id, user, payload);

    return response.noContent();
  }

  public async disable({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      DisableBusinessUnitFiscalDocumentValidator,
    );
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.disable(unit_id, user, payload);

    return response.noContent();
  }

  public async correct({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CorrectBusinessUnitFiscalDocumentValidator,
    );
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.correct(unit_id, user, payload);

    return response.noContent();
  }
}
