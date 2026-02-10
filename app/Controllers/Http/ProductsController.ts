import { inject } from "@adonisjs/fold";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ProductService from "App/Services/ProductService";
import SharedService from "App/Services/SharedService";
import CalculateStockValidator from "App/Validators/Product/CalculateStockValidator";
import CreateProductValidator from "App/Validators/Product/CreateProductValidator";
import UpdateProductValidator from "App/Validators/Product/UpdateProductValidator";

@inject()
export default class ProductsController {
  constructor(
    private readonly service: ProductService,
    private readonly sharedService: SharedService,
  ) {}

  public async forMovements({ auth, request, response }: HttpContextContract) {
    const result = await this.service.forMovement(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async index({ auth, request, response }: HttpContextContract) {
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateProductValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateProductValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async calculateStock({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CalculateStockValidator);

    const result = await this.service.calculateStock(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(await this.sharedService.getAuthContext(auth), params.id);

    return response.noContent();
  }
}
