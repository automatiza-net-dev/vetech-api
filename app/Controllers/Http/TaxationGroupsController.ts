import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TaxationGroupService from 'App/Services/TaxationGroupService';
import CreateTaxationGroupValidator from 'App/Validators/TaxationGroup/CreateTaxationGroupValidator';
import UpdateTaxationGroupValidator from 'App/Validators/TaxationGroup/UpdateTaxationGroupValidator';

@inject()
export default class TaxationGroupsController {
  constructor(
    private taxationGroupService: TaxationGroupService,
    private sharedService: SharedService,
  ) {}

  public async index({ request, response, auth }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const data = request.only(['name', 'active']);

    const result = await this.taxationGroupService.index(unit_id, data);

    return response.ok(result);
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const payload = await request.validate(CreateTaxationGroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.taxationGroupService.store(unit_id, payload);

    return response.created(result);
  }

  public async show({ request, response, auth }: HttpContextContract) {
    const { id } = request.params();
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.taxationGroupService.show(unit_id, id);

    return response.ok(result);
  }

  public async update({ request, response, auth }: HttpContextContract) {
    const { id } = request.params();
    const payload = await request.validate(UpdateTaxationGroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.taxationGroupService.update(unit_id, id, payload);

    return response.ok(result);
  }

  public async destroy({ request, response, auth }: HttpContextContract) {
    const { id } = request.params();
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.taxationGroupService.destroy(unit_id, id);

    return response.noContent();
  }
}
