import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import FiscalDocumentService from 'App/Services/FiscalDocumentService';

@inject()
export default class FiscalDocumentsController {
  constructor(private readonly service: FiscalDocumentService) {}
  async index({ request, response }: HttpContextContract) {
    const result = await this.service.index(request.qs());

    return response.ok(result);
  }
}
