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
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      description: qs.description,
    });

    return response.ok(result);
  }
}
