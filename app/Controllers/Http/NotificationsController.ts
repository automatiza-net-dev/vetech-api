import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import NotificationsService from "App/Services/NotificationsService";

@inject()
export default class NotificationsController {
	constructor(
		private sharedService: SharedService,
		private notificationService: NotificationsService,
	) {}

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
}
