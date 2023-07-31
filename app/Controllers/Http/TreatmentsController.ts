import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TreatmentService from 'App/Services/TreatmentService';
import BatchCreateExecutionValidator from 'App/Validators/Treatment/BatchCreateExecutionValidator';
import BatchExecuteExecutionValidator from 'App/Validators/Treatment/BatchExecuteExecutionValidator';
import CancelTreatmentValidator from 'App/Validators/Treatment/CancelTreatmentValidator';
import CreateTreatmentExecutionValidator from 'App/Validators/Treatment/CreateTreatmentExecutionValidator';
import CreateTreatmentItemValidator from 'App/Validators/Treatment/CreateTreatmentItemValidator';
import CreateTreatmentValidator from 'App/Validators/Treatment/CreateTreatmentValidator';
import ExcludeTreatmentExecutionValidator from 'App/Validators/Treatment/ExcludeTreatmentExecutionValidator';
import ExecuteTreatmentExecutionValidator from 'App/Validators/Treatment/ExecuteTreatmentExecutionValidator';
import UpdateTreatmentExecutionValidator from 'App/Validators/Treatment/UpdateTreatmentExecutionValidator';

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

  public async batchCreateExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(BatchCreateExecutionValidator);

    await this.service.batchCreateExecution(authCtx, data);

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

  public async batchExecuteExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(BatchExecuteExecutionValidator);

    await this.service.batchExecuteExecution(authCtx, data);

    return response.noContent();
  }

  public async cancelTreatment({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(CancelTreatmentValidator);

    await this.service.cancelTreatment(authCtx, data);

    return response.noContent();
  }

  public async searchTreatment({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchTreatments(authCtx, qs);

    return response.ok(result);
  }

  public async searchCompleteTreatment({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchCompleteTreatments(authCtx, qs);

    return response.ok(result);
  }

  public async searchTreatmentItems({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchTreatmentItems(authCtx, qs);

    return response.ok(result);
  }

  public async searchDateExecutions({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchDateExecutions(authCtx, qs);

    return response.ok(result);
  }

  public async searchNotExecutedItems({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchSomething(authCtx, {
      client: qs.client,
    });

    return response.ok(result);
  }

  public async searchTreatmentExecutions({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchTreatmentExecutions(authCtx, qs);

    return response.ok(result);
  }

  public async searchClientScheduling({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.searchClientScheduling(authCtx, qs);

    return response.ok(result);
  }

  public async updateTreatmentExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(UpdateTreatmentExecutionValidator);

    await this.service.updateTreatmentExecution(authCtx, data);

    return response.noContent();
  }

  public async cancelTreatmentExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(ExcludeTreatmentExecutionValidator);

    await this.service.cancelTreatmentExecution(authCtx, data);

    return response.noContent();
  }

  public async excludeTreatmentExecution({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await request.validate(ExcludeTreatmentExecutionValidator);

    await this.service.excludeTreatmentExecution(authCtx, data);

    return response.noContent();
  }
}
