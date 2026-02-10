import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Logger from "@ioc:Adonis/Core/Logger";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnitFiscalDocumentService from "App/Services/BusinessUnitFiscalDocumentService";
import Drive from "@ioc:Adonis/Core/Drive";

@inject()
export default class WebhooksController {
  constructor(private fiscalDocumentService: BusinessUnitFiscalDocumentService) {}

  public async nfe({ request, response }: HttpContextContract) {
    const body = request.body();
    if (!body.ref) {
      throw new BadRequestException("No ref", 400, "E_ERR");
    }

    await Drive.use("s3").put(
      `focus-webhooks/nfe-${body.ref}-${Date.now()}.json`,
      JSON.stringify(body),
      {
        contentType: "application/json",
      },
    );

    const data = await this.fiscalDocumentService.updateFromFocusWithWebhook(body.ref);

    return response.ok(data);
  }

  public async nfse({ request, response }: HttpContextContract) {
    const body = request.body();
    if (!body.ref) {
      throw new BadRequestException("No ref", 400, "E_ERR");
    }

    await Drive.use("s3").put(
      `focus-webhooks/nfse-${body.ref}-${Date.now()}.json`,
      JSON.stringify(body),
      {
        contentType: "application/json",
      },
    );

    const data = await this.fiscalDocumentService.updateNfseFromFocusWithWebhook(body.ref);

    return response.ok(data);
  }

  public async disable({ request, response }: HttpContextContract) {
    Logger.info(JSON.stringify(request.body(), undefined, 2));

    await Drive.use("s3").put(
      `focus-webhooks/disable-${Date.now()}.json`,
      JSON.stringify(request.body()),
      {
        contentType: "application/json",
      },
    );

    await this.fiscalDocumentService.disableFromWebhook(request.body());

    return response.noContent();
  }
}
