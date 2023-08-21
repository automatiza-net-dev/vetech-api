import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { inject } from '@adonisjs/fold';
import IndicatorService from 'App/Services/IndicatorService';
import SharedService from 'App/Services/SharedService';

@inject()
export default class IndicatorsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: IndicatorService,
  ) {}

  public async medianTicket({ auth, request, response }: HttpContextContract) {
    const result = await this.service.medianTicket(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async medianTicketByOrigin({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.medianTicketByOrigin(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async invoicingByProductType({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.invoicingByProductType(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async invoicingByPaymentMethod({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.invoicingByPaymentMethod(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async invoicingByNewClients({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.invoicingByNewClients(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }
}
