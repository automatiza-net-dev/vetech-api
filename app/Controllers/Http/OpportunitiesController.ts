import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import OpportunityService from 'App/Services/OpportunityService';
import SharedService from 'App/Services/SharedService';
import CreateOpportunityValidator from 'App/Validators/Opportunity/CreateOpportunityValidator';

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
}
