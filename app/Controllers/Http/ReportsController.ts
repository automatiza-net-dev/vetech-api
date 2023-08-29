import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { inject } from '@adonisjs/fold';
import ReportService from 'App/Services/ReportService';
import SharedService from 'App/Services/SharedService';

@inject()
export default class ReportsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: ReportService,
  ) {}

  public async finances({ request, response, auth }: HttpContextContract) {
    response.ok(
      await this.service.financeReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async dailyFlow({ request, response, auth }: HttpContextContract) {
    response.ok(
      await this.service.cashierFlowReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async checkingAccountsBalance({
    request,
    response,
    auth,
  }: HttpContextContract) {
    response.ok(
      await this.service.checkingAccountReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async expiredFinancesReport({
    request,
    response,
    auth,
  }: HttpContextContract) {
    response.ok(
      await this.service.expiredFinancesReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async salesReport({ request, response, auth }: HttpContextContract) {
    response.ok(
      await this.service.salesReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async detailedSalesReport({
    request,
    response,
    auth,
  }: HttpContextContract) {
    response.ok(
      await this.service.detailedSalesReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async entriesReport({ request, response, auth }: HttpContextContract) {
    response.ok(
      await this.service.entriesReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }

  public async budgetsReport({ request, response, auth }: HttpContextContract) {
    response.ok(
      await this.service.budgetsReport(
        await this.sharedService.getAuthContext(auth),
        request.qs(),
      ),
    );
  }
}
