import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import IndicatorService from "App/Services/IndicatorService";
import SharedService from "App/Services/SharedService";

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

	public async medianTicketByOrigin_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.medianTicketByOrigin_2(
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

	public async invoicingByProductType_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.invoicingByProductType_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async invoicingByProductTypeWithSubgroup({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.invoicingByProductTypeWithSubgroup(
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

	public async invoicingByPaymentMethod_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.invoicingByPaymentMethod_2(
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

	public async subgroupTreeIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.subgroupTreeIndicators(
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

	public async crmIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.crmIndicators_2(
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

	public async projectionIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.projectionIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async billingIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.billingIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async productTypeIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.productTypeIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async salesPerPeriodIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.salesPerPeriodIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async budgetIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.budgetsIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async budgetByStatusIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.budgetsByStatusIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async marketingIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.marketingIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async costOfAcquisitionIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.costOfAcquisitionIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async billPaymentFormatIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.billPaymentFormatIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async installmentAvgIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.installmentAvgIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async avgReceiptDeadlineIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.avgReceiptDeadlineIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async clientGroupTreeIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.clientGroupTreeIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async invoicingNewClientsPeriod_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.invoicingNewClientsPeriod_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async billPaymentFormatIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.billPaymentFormatIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async billForUserPeriod_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.billForUserPeriod_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async productType_2({ auth, request, response }: HttpContextContract) {
		const result = await this.service.productTypeIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async subgroupIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.subgroupIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async chartsIndicators({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.chartsIndicators(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		response.header("Cache-Control", "private, max-age=60");
		return response.ok(result);
	}

	public async salesPerPeriodIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.salesPerPeriodIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async budgetsIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.budgetsIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async schedulingIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.schedulingIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async schedulingOpportunitiesIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.schedulingOpportunitiesIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async opportunitiesIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.opportunitiesIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async invoicingNewClients_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.invoicingNewClients_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async salesPerUserIndicators_2({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.salesPerUserIndicators_2(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}
}
