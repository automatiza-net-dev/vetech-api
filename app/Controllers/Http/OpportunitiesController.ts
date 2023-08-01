import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import OpportunityService from 'App/Services/OpportunityService';
import SharedService from 'App/Services/SharedService';
import CancelOpportunityActivityValidator from 'App/Validators/Opportunity/CancelOpportunityActivityValidator';
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

  public async show({ params, response, auth }: HttpContextContract) {
    const result = await this.service.showOpportunity(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async search({ request, response, auth }: HttpContextContract) {
    const result = await this.service.searchOpportunities(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async searchActivities({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const result = await this.service.searchActivities(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async searchKanban({ request, response, auth }: HttpContextContract) {
    const result = await this.service.searchKanbanOpportunities(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async searchKanbanActivities({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const result = await this.service.searchKanbanOpportunityActivities(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

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
    const payload = await request.validate(CancelOpportunityActivityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.executeActivity(authCtx, params.id, payload);

    return response.noContent();
  }

  public async updateActivity({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateOpportunityActivityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.updateActivity(authCtx, payload);

    return response.noContent();
  }

  public async cancelActivity({
    request,
    response,
    auth,
    params,
  }: HttpContextContract) {
    const payload = await request.validate(CancelOpportunityActivityValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.cancelActivity(authCtx, params.id, payload);

    return response.noContent();
  }
}
