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

  public async medianTicketConsolidated({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.medianTicketConsolidated(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async medianTicketByOriginConsolidated({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.medianTicketByOriginConsolidated(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async invoicingByProductTypeConsolidated({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.invoicingByProductTypeConsolidated(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async invoicingByPaymentMethodConsolidated({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.invoicingByPaymentMethodConsolidated(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async invoicingByNewClientsConsolidated({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.invoicingByNewClientsConsolidated(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async schedulingIndicators({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.schedulingIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async subgroupIndicators({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.subgroupIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async consolidatedSubgroupIndicators({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.consolidatedSubgroupIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async opportunitiesIndicators({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.opportunitiesIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async generalOpportunitiesIndicators({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.generalOpportunitiesIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async crmIndicators({ auth, request, response }: HttpContextContract) {
    const result = await this.service.crmIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async unconfirmedBudgetsIndicators({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.unconfirmedBudgetsIndicators(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }
}
