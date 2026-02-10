import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import WhatsAppMessagesConfigService from "App/Services/WhatsAppMessagesConfigService";
import SharedService from "App/Services/SharedService";
import CreateWhatsAppMessagesConfigValidator from "App/Validators/WhatsAppMessagesConfig/CreateWhatsAppMessagesConfigValidator";
import UpdateWhatsAppMessagesConfigValidator from "App/Validators/WhatsAppMessagesConfig/UpdateWhatsAppMessagesConfigValidator";
import IndexWhatsAppMessagesConfigValidator from "App/Validators/WhatsAppMessagesConfig/IndexWhatsAppMessagesConfigValidator";

@inject()
export default class WhatsAppMessagesConfigsController {
  constructor(
    private sharedService: SharedService,
    private service: WhatsAppMessagesConfigService,
  ) {}

  async index({ auth, request, response }: HttpContextContract) {
    const qs = await request.validate(IndexWhatsAppMessagesConfigValidator);

    const result = await this.service.index(await this.sharedService.getAuthContext(auth), {
      whatsappPhone: qs.whatsappPhone,
      platformIntegration: qs.platformIntegration,
      status: qs.status,
      connectionStatus: qs.connectionStatus,
    });

    return response.ok(result);
  }

  async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateWhatsAppMessagesConfigValidator);

    await this.service.store(await this.sharedService.getAuthContext(auth), payload);

    return response.created();
  }

  async update({ auth, params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateWhatsAppMessagesConfigValidator);

    await this.service.update(await this.sharedService.getAuthContext(auth), params.id, payload);

    return response.noContent();
  }

  async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.delete(await this.sharedService.getAuthContext(auth), params.id);

    return response.noContent();
  }
}
