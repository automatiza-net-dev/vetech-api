import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BudgetService from 'App/Services/BudgetService';
import SharedService from 'App/Services/SharedService';
import AddKitToBudgetValidator from 'App/Validators/Budget/AddKitToBudgetValidator';
import CancelBudgetValidator from 'App/Validators/Budget/CancelBudgetValidator';
import ConfirmBudgetValidator from 'App/Validators/Budget/ConfirmBudgetValidator';
import CreateBudgetItemValidator from 'App/Validators/Budget/CreateBudgetItemValidator';
import CreateBudgetValidator from 'App/Validators/Budget/CreateBudgetValidator';
import UpdateBudgetItemValidator from 'App/Validators/Budget/UpdateBudgetItemValidator';

@inject()
export default class BudgetsController {
  constructor(
    private sharedService: SharedService,
    private service: BudgetService,
  ) {}

  public async partialIndex({ request, response, auth }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.partialIndex(unit_id, {
      fromCreation: qs.fromCreation,
      toCreation: qs.toCreation,
      fromExpiration: qs.fromExpiration,
      toExpiration: qs.toExpiration,
      seller: qs.seller,
      status: qs.status,
      patient: qs.patient,
      tag: qs.tag,
    });

    return response.ok(result);
  }

  public async completeIndex({ request, response, auth }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.completeIndex(unit_id, {
      budget: qs.budget,
      patient: qs.patient,
    });

    return response.ok(result);
  }

  public async show({ params, response, auth }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async searchProducts({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.searchProducts(unit_id, {
      variation: qs.variation,
      description: qs.description,
      unit: qs.unit,
      quantity: qs.quantity,
      minPrice: qs.minPrice,
      maxPrice: qs.maxPrice,
      maxDiscountPercentage: qs.maxDiscountPercentage,
      reference: qs.reference,
      barcode: qs.barcode,
    });

    return response.ok(result);
  }

  public async createBudget({ request, response, auth }: HttpContextContract) {
    const payload = await request.validate(CreateBudgetValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.createBudget(unit_id, user, payload);

    return response.created(result);
  }

  public async createBudgetItem({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(CreateBudgetItemValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.createBudgetItem(unit_id, payload);

    return response.created(result);
  }

  public async updateBudgetItem({
    request,
    params,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateBudgetItemValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.updateBudgetItem(
      unit_id,
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async confirmBudget({
    params,
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(ConfirmBudgetValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.confirmBudget(
      unit_id,
      params.id,
      user,
      payload,
    );

    return response.ok(result);
  }

  public async cancelBudget({
    params,
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(CancelBudgetValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.cancelBudget(unit_id, params.id, user, payload);

    return response.noContent();
  }

  public async addKitToBudget({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(AddKitToBudgetValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.addFromKit(unit_id, payload);

    return response.noContent();
  }
}
