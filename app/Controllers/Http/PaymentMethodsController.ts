import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PaymentMethodService from 'App/Services/PaymentMethodService';
import SharedService from 'App/Services/SharedService';
import CreatePaymentMethodFlagValidator from 'App/Validators/PaymentMethod/CreatePaymentMethodFlagValidator';
import CreatePaymentMethodValidator from 'App/Validators/PaymentMethod/CreatePaymentMethodValidator';

@inject()
export default class PaymentMethodsController {
  constructor(
    private sharedService: SharedService,
    private service: PaymentMethodService,
  ) {}

  public async createPaymentMethod({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(CreatePaymentMethodValidator);
    const result = await this.service.createPaymentMethod(unit_id, payload);

    return response.created(result);
  }

  public async createPaymentMethodFlag({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(CreatePaymentMethodFlagValidator);
    const result = await this.service.createPaymentMethodFlag(unit_id, payload);

    return response.created(result);
  }
}
