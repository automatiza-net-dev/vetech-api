import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { inject } from "@adonisjs/fold";
import FiscalDocumentService from 'App/Services/FiscalDocumentService';

@inject()
export default class FiscalDocumentsController {
  constructor(private readonly service: FiscalDocumentService) {

  }
  async index({ response }: HttpContextContract) {
    const result = await this.service.index();

    return response.ok(result);
  }
}
