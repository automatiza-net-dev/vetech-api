import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BillService from 'App/Services/BillService';
import SharedService from 'App/Services/SharedService';
import AddKitToBillValidator from 'App/Validators/Bill/AddKitToBillValidator';
import CreateBillItemValidator from 'App/Validators/Bill/CreateBillItemValidator';
import CreateBillPaymentValidator from 'App/Validators/Bill/CreateBillPaymentValidator';
import CreateBillValidator from 'App/Validators/Bill/CreateBillValidator';
import UpdateBillItemValidator from 'App/Validators/Bill/UpdateBillItemValidator';

@inject()
export default class BillsController {
  constructor(
    private sharedService: SharedService,
    private service: BillService,
  ) {}

  public async index({ request, response, auth }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      client: qs.client,
      status: qs.status,
      fromBill: qs.fromBill,
      toBill: qs.toBill,
      patient: qs.patient,
      tag: qs.tag,
      patientTag: qs.patientTag,
    });

    return response.ok(result);
  }

  public async show({ params, auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async recalculate({ params, auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.recalculateItemsTaxes(unit_id, params.id);

    return response.noContent();
  }

  public async createBill({ request, response, auth }: HttpContextContract) {
    const payload = await request.validate(CreateBillValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.createBill(unit_id, user, payload);

    return response.created(result);
  }

  public async createBillItem({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(CreateBillItemValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.createBillItem(unit_id, payload);

    return response.created(result);
  }

  public async updateBillItem({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateBillItemValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.updateBillItem(unit_id, payload);

    return response.ok(result);
  }

  public async deleteBillItem({ params, auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.deleteBillItem(unit_id, params.id);

    return response.noContent();
  }

  public async createBillPayment({
    request,
    response,
    auth,
  }: HttpContextContract) {
    const payload = await request.validate(CreateBillPaymentValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.createBillPayment(unit_id, user, payload);

    return response.created(result);
  }

  public async deleteBillPayment({
    params,
    response,
    auth,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.deleteBillPayment(unit_id, params.id);

    return response.noContent();
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
      quantity: qs.quantity,
      reference: qs.reference,
      barcode: qs.barcode,
    });

    return response.ok(result);
  }

  public async searchTax({ request, response, auth }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.searchTax(unit_id, {
      variation: qs.variation,
      origin: qs.origin,
      destination: qs.destination,
      category: qs.category,
      type: qs.type,
    });

    return response.ok(result);
  }

  public async closeBill({ params, auth, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.closeBill(unit_id, user, params.id);
    return response.noContent();
  }

  public async reopenBill({ params, auth, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.reopenBill(unit_id, user, params.id);
    return response.noContent();
  }

  public async disableBillItem({
    params,
    auth,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.disableBillItem(unit_id, params.id);
    return response.noContent();
  }

  public async addKitToBill({ request, response, auth }: HttpContextContract) {
    const payload = await request.validate(AddKitToBillValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.addFromKit(unit_id, payload);

    return response.noContent();
  }

  public async fetchConferenceCashier({
    params,
    response,
    auth,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const result = await this.service.fetchConferenceCashier(
      authCtx,
      params.id,
    );

    return response.ok(result);
  }
}
