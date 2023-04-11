import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientAnimalHairService from 'App/Services/PatientAnimalHairService';
import SharedService from 'App/Services/SharedService';

@inject()
export default class PatientAnimalHairsController {
  constructor(
    private sharedService: SharedService,
    private service: PatientAnimalHairService,
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
