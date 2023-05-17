import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TreatmentService from 'App/Services/TreatmentService';
import CreateTreatmentExecutionValidator from 'App/Validators/Treatment/CreateTreatmentExecutionValidator';
import CreateTreatmentItemValidator from 'App/Validators/Treatment/CreateTreatmentItemValidator';
import CreateTreatmentValidator from 'App/Validators/Treatment/CreateTreatmentValidator';
import ExecuteTreatmentExecutionValidator from 'App/Validators/Treatment/ExecuteTreatmentExecutionValidator';

@inject()
export default class TreatmentsController {
  constructor(
    private readonly service: TreatmentService,
    private readonly sharedService: SharedService,
  ) {}

  public async create({ request, response, auth }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(CreateTreatmentValidator);

    await this.service.create(authCtx, data);

    return response.created();
  }

  public async createItem({ request, response, auth }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(CreateTreatmentItemValidator);

    await this.service.createItem(authCtx, data);

    return response.created();
  }

  public async createExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(CreateTreatmentExecutionValidator);

    await this.service.createExecution(authCtx, data);

    return response.created();
  }

  public async executeExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(ExecuteTreatmentExecutionValidator);

    await this.service.executeExecution(authCtx, data);

    return response.noContent();
  }
}
