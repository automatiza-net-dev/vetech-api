import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import OpportunityService from 'App/Services/OpportunityService';
import SharedService from 'App/Services/SharedService';
import CreateOpportunityActivityValidator from 'App/Validators/Opportunity/CreateOpportunityActivityValidator';
import CreateOpportunityValidator from 'App/Validators/Opportunity/CreateOpportunityValidator';
import UpdateOpportunityActivityValidator from 'App/Validators/Opportunity/UpdateOpportunityActivityValidator';
import UpdateOpportunityValidator from 'App/Validators/Opportunity/UpdateOpportunityValidator';

@inject()
export default class OpportunitiesController {
  constructor(
    private sharedService: SharedService,
    private service: OpportunityService,
  ) {}

  public async store({ request, response, auth }: HttpContextContract) {
    const payload = await request.validate(CreateOpportunityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.store(authCtx, payload);

    return response.created();
  }

  public async update({
    request,
    response,
    auth,
    params,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateOpportunityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.update(authCtx, params.id, payload);

    return response.noContent();
  }

  public async createActivity({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(CreateOpportunityActivityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.addActivity(authCtx, payload);

    return response.noContent();
  }

  public async executeActivity({
    request,
    response,
    auth,
    params,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateOpportunityActivityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.executeActivity(authCtx, params.id, payload);

    return response.noContent();
  }

  public async cancelActivity({
    request,
    response,
    auth,
    params,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateOpportunityActivityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.cancelActivity(authCtx, params.id, payload);

    return response.noContent();
  }
}
