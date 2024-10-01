import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import ReportService from "App/Services/ReportService";
import SharedService from "App/Services/SharedService";

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

	public async saleAnalyticsReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.saleAnalyticsReport(
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

	public async schedulingReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.schedulingReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async productTypesReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.productTypeReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async competenceReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.competenceReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async planGroupReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.planGroupReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async buySuggestionReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.buySuggestionReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async issuedNfeReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.issuedNfeReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async issuedNfseReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.issuedNfseReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async receiptsReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.receiptsReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async receiptAnalyticsReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.receiptAnalyticsReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async crmOpportunitiesReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.crmOpportunities(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async crmOpportunitiesReport_2({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.crmOpportunities_2(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async crmActivities({ request, response, auth }: HttpContextContract) {
		response.ok(
			await this.service.crmActivies(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async clientLogReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.clientLogReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async vaccineVermifugeReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.vaccineVermifuge(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async marketingCampaignReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.marketingCampaign(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}

	public async dreGroupsReport({
		request,
		response,
		auth,
	}: HttpContextContract) {
		response.ok(
			await this.service.dreGroupReport(
				await this.sharedService.getAuthContext(auth),
				request.qs(),
			),
		);
	}
}
