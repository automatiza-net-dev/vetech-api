import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BrandService from 'App/Services/BrandService';
import SharedService from 'App/Services/SharedService';

@inject()
export default class BrandsController {
  constructor(
    private sharedService: SharedService,
    private service: BrandService,
  ) {}

  public async index({ request, response, auth }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        description: qs.description,
      },
    );

    return response.ok(result);
  }
}
