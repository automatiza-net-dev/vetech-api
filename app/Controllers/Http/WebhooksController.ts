import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Logger from '@ioc:Adonis/Core/Logger';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnitFiscalDocumentService from 'App/Services/BusinessUnitFiscalDocumentService';

@inject()
export default class WebhooksController {
  constructor(
    private fiscalDocumentService: BusinessUnitFiscalDocumentService,
  ) {}

  public async nfe({ request, response }: HttpContextContract) {
    const { ref } = request.body();
    if (!ref) {
      throw new BadRequestException('No ref', 400, 'E_ERR');
    }

    Logger.info(
      JSON.stringify(
        {
          ref,
        },
        undefined,
        2,
      ),
    );

    const data = await this.fiscalDocumentService.updateFromFocusWithWebhook(
      ref,
    );

    return response.ok(data);
  }

  public async nfse({ request, response }: HttpContextContract) {
    const { ref } = request.body();
    if (!ref) {
      throw new BadRequestException('No ref', 400, 'E_ERR');
    }

    Logger.info(
      JSON.stringify(
        {
          ref,
        },
        undefined,
        2,
      ),
    );

    const data =
      await this.fiscalDocumentService.updateNfseFromFocusWithWebhook(ref);

    return response.ok(data);
  }

  public async disable({ request, response }: HttpContextContract) {
    Logger.info(JSON.stringify(request.body(), undefined, 2));

    await this.fiscalDocumentService.disableFromWebhook(request.body());

    return response.noContent();
  }
}
