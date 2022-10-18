import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TaxOperationService from 'App/Services/TaxOperationService';
import CreateTaxOperationValidator from 'App/Validators/TaxOperation/CreateTaxOperationValidator';
import UpdateTaxOperationValidator from 'App/Validators/TaxOperation/UpdateTaxOperationValidator';

@inject()
export default class TaxOperationsController {
  constructor(
    private sharedService: SharedService,
    private taxOperationService: TaxOperationService,
  ) {}

  public async index({ request, response, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const data = request.only(['type', 'category']);
    const result = await this.taxOperationService.index(unit_id, user, data);

    return response.ok(result);
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const payload = await request.validate(CreateTaxOperationValidator);

    const taxOperation = await this.taxOperationService.store(
      unit_id,
      user,
      payload,
    );

    return response.created(taxOperation);
  }

  public async show({ params, response, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const taxOperation = await this.taxOperationService.show(
      unit_id,
      user,
      params.id,
    );

    return response.ok(taxOperation);
  }

  public async update({
    params,
    request,
    response,
    auth,
  }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const data = await request.validate(UpdateTaxOperationValidator);

    const taxOperation = await this.taxOperationService.update(
      unit_id,
      user,
      params.id,
      data,
    );

    return response.ok(taxOperation);
  }

  public async destroy({ params, response, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    await this.taxOperationService.destroy(unit_id, user, params.id);

    return response.noContent();
  }
}
