import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ProductVariationService from 'App/Services/ProductVariationService';
import SharedService from 'App/Services/SharedService';
import CreateProductVariationValidator from 'App/Validators/ProductVariation/CreateProductVariationValidator';
import UpdateProductVariationValidator from 'App/Validators/ProductVariation/UpdateProductVariationValidator';

@inject()
export default class ProductVariationsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: ProductVariationService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const result = await this.service.index(unit_id);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateProductVariationValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateProductVariationValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
