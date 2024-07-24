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

	public async rolesNotifications({ response, auth }: HttpContextContract) {
		return response.ok(
			await this.notificationService.undefinedRoles(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}
}
