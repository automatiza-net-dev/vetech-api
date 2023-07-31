import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { inject } from '@adonisjs/fold';
import SharedService from 'App/Services/SharedService';
import ProductivityItemService from 'App/Services/ProductivityItemService';
import CreateProductivityItemValidator from 'App/Validators/ProductivityItem/CreateProductivityItemValidator';
import UpdateProductivityItemValidator from 'App/Validators/ProductivityItem/UpdateProductivityItemValidator';
import CreateProductivityItemProductValidator from 'App/Validators/ProductivityItem/CreateProductivityItemProductValidator';
import UpdateProductivityItemProductValidator from 'App/Validators/ProductivityItem/UpdateProductivityItemProductValidator';

@inject()
export default class ProductivityItemsController {
  constructor(
    private sharedService: SharedService,
    private service: ProductivityItemService,
  ) {}

  public async storeItem({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateProductivityItemValidator);

    const result = await this.service.storeItem(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async updateItem({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateProductivityItemValidator);

    await this.service.updateItem(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.noContent();
  }

  public async searchItems({ auth, request, response }: HttpContextContract) {
    const result = await this.service.searchItems(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async storeItemProduct({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      CreateProductivityItemProductValidator,
    );

    const result = await this.service.batchCreateItemProduct(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async updateItemProduct({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      UpdateProductivityItemProductValidator,
    );

    await this.service.updateItemProduct(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.noContent();
  }

  public async searchItemProducts({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const result = await this.service.searchItemProducts(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }
}
