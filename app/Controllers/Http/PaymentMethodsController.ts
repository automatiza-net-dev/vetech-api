import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PaymentMethodService from 'App/Services/PaymentMethodService';
import SharedService from 'App/Services/SharedService';
import CreatePaymentMethodFeeValidator from 'App/Validators/PaymentMethod/CreatePaymentMethodFeeValidator';
import CreatePaymentMethodFlagValidator from 'App/Validators/PaymentMethod/CreatePaymentMethodFlagValidator';
import CreatePaymentMethodValidator from 'App/Validators/PaymentMethod/CreatePaymentMethodValidator';

@inject()
export default class PaymentMethodsController {
  constructor(
    private sharedService: SharedService,
    private service: PaymentMethodService,
  ) {}

  public async searchPartialPaymentMethods({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.searchPartialPaymentMethods(unit_id, {
      description: qs.description,
      tef: qs.tef,
      type: qs.type,
    });

    return response.ok(result);
  }

  public async searchCompletePaymentMethods({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.searchCompletePaymentMethods(unit_id, {
      description: qs.description,
      tef: qs.tef,
      type: qs.type,
      active: qs.active,
      cancellation: qs.cancellation,
      account: qs.account,
    });

    return response.ok(result);
  }

  public async searchTefFlags({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.searchTefFlags(unit_id, {
      type: qs.type,
    });

    return response.ok(result);
  }

  public async searchTefAcquirers({ auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.searchTefAcquirers(unit_id);

    return response.ok(result);
  }

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

  public async createPaymentMethodFee({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(CreatePaymentMethodFeeValidator);
    const result = await this.service.createPaymentMethodFee(unit_id, payload);

    return response.created(result);
  }
}
