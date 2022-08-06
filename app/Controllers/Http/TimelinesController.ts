import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import AnimalWeightService from 'App/Services/AnimalWeightService';
import CreateAnimalWeightValidator from 'App/Validators/Timeline/CreateAnimalWeightValidator';

@inject()
export default class TimelinesController {
  constructor(private readonly animalWeightService: AnimalWeightService) {}

  public async animalWeightIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.animalWeightService.index(params.id));
  }
  public async animalWeightStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalWeightValidator);
    await this.animalWeightService.store(payload);
    return response.created();
  }
}
