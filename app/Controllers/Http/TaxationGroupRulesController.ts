import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TaxationGroupRuleService from 'App/Services/TaxationGroupRuleService';
import CreateTaxationGroupRuleValidator from 'App/Validators/TaxationGroupRule/CreateTaxationGroupRuleValidator';
import UpdateTaxationGroupRuleValidator from 'App/Validators/TaxationGroupRule/UpdateTaxationGroupRuleValidator';

@inject()
export default class TaxationGroupRulesController {
  constructor(
    private sharedService: SharedService,
    private service: TaxationGroupRuleService,
  ) {}

  public async index({ response, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const rules = await this.service.index(unit_id, user);

    return response.ok(rules);
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateTaxationGroupRuleValidator);

    const rule = await this.service.store(payload);

    return response.created(rule);
  }

  public async show({ params, response, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const rule = await this.service.show(unit_id, user, params.id);

    return response.ok(rule);
  }

  public async update({
    params,
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateTaxationGroupRuleValidator);

    const { unit_id, user } = this.sharedService.extractUser(auth);

    const rule = await this.service.update(unit_id, user, params.id, payload);
    return response.ok(rule);
  }

  public async destroy({ params, auth }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, user, params.id);
  }
}
