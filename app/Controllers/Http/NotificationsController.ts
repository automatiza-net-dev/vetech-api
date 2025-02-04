import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import NotificationsService from "App/Services/NotificationsService";
import CreateNotificationValidator from "App/Validators/Notification/CreateNotificationValidator";

@inject()
export default class NotificationsController {
	constructor(
		private sharedService: SharedService,
		private notificationService: NotificationsService,
	) {}

	public async listNotifications({ response, auth }: HttpContextContract) {
		return response.ok(
			await this.notificationService.listNotifications(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async createNotification({
		request,
		response,
		auth,
	}: HttpContextContract) {
		const data = await request.validate(CreateNotificationValidator);

		return response.created(
			await this.notificationService.createNotification(
				await this.sharedService.getAuthContext(auth),
				data,
			),
		);
	}

	public async updateNotification({
		request,
		response,
		auth,
		params,
	}: HttpContextContract) {
		const data = await request.validate(CreateNotificationValidator);

		return response.ok(
			await this.notificationService.updateNotification(
				await this.sharedService.getAuthContext(auth),
				params.id,
				data,
			),
		);
	}

	public async excludeNotification({
		response,
		auth,
		params,
	}: HttpContextContract) {
		await this.notificationService.excludeNotification(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.noContent();
	}

	public async fullNotifications({ response, auth }: HttpContextContract) {
		return response.ok(
			await this.notificationService.fullNotifications(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async unreadNotifications({ response, auth }: HttpContextContract) {
		const all = await this.notificationService.fullNotifications(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok({ data: { number: all.data.length } });
	}

	public async rolesNotifications({ response, auth }: HttpContextContract) {
		return response.ok(
			await this.notificationService.undefinedRoles(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async pendingBillsNotifications({
		response,
		auth,
	}: HttpContextContract) {
		return response.ok(
			await this.notificationService.pendingBills(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async pendingBudgetsNotifications({
		response,
		auth,
	}: HttpContextContract) {
		return response.ok(
			await this.notificationService.pendingBudgets(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async pendingBillItemEvaluations({
		response,
		auth,
	}: HttpContextContract) {
		return response.ok(
			await this.notificationService.pendingBillItemEvaluations(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}
	public async pendingBillPaymentEvaluations({
		response,
		auth,
	}: HttpContextContract) {
		return response.ok(
			await this.notificationService.pendingBillItemEvaluations(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}
	public async pendingBillPaymentApprovals({
		response,
		auth,
	}: HttpContextContract) {
		return response.ok(
			await this.notificationService.pendingBillPaymentApprovals(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}
}
