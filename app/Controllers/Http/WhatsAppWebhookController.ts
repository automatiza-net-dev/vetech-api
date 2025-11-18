import { inject } from "@adonisjs/fold";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import WhatsAppWebhookValidator from "App/Validators/WhatsAppWebhookValidator";
import WhatsAppMessagesConfigService from "App/Services/WhatsAppMessagesConfigService";
import SharedService from "App/Services/SharedService";

@inject()
export default class WhatsAppWebhookController {
	constructor(
		private readonly whatsappService: WhatsAppMessagesConfigService,
		private shared: SharedService,
	) {}

	public async receiveTintim({ request, response }: HttpContextContract) {
		try {
			const payload = await request.validate(WhatsAppWebhookValidator);

			await this.whatsappService.processTintimWebhook(payload, request.body());

			return response.status(200).json({
				success: true,
				message: "Webhook processado com sucesso",
			});
		} catch (error) {
			console.error("Erro ao processar webhook do WhatsApp:", error);
			return response.status(500).json({
				success: false,
				message: "Erro interno ao processar webhook",
			});
		}
	}

	public async searchMessages({
		auth,
		request,
		response,
	}: HttpContextContract) {
		return response.ok(
			await this.whatsappService.searchMessages(
				await this.shared.getAuthContext(auth),
				request.param("configID", "0"),
				request.qs(),
			),
		);
	}
}
