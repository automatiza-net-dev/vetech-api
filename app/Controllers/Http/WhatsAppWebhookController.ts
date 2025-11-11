import { inject } from "@adonisjs/fold";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import WhatsAppWebhookValidator from "App/Validators/WhatsAppWebhookValidator";
import WhatsAppMessagesConfigService from "App/Services/WhatsAppMessagesConfigService";

@inject()
export default class WhatsAppWebhookController {
	constructor(
		private readonly whatsappService: WhatsAppMessagesConfigService,
	) {}

	public async receive({ request, response }: HttpContextContract) {
		try {
			const payload = await request.validate(WhatsAppWebhookValidator);

			await this.whatsappService.processWebhook(
				request.param("id", "0"),
				payload,
				request.body(),
			);

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
}
