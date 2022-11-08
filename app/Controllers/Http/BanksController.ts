import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BankService from 'App/Services/BankService';

@inject()
export default class BanksController {
  constructor(private service: BankService) {}

  public async index({ request, response }: HttpContextContract) {
    const data = request.only(['name', 'code', 'active']);

    const banks = await this.service.index(data);

    return response.ok(banks);
  }
}
