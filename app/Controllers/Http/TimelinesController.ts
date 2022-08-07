import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import AnimalDocumentService from 'App/Services/AnimalDocumentService';
import AnimalObservationService from 'App/Services/AnimalObservationService';
import AnimalWeightService from 'App/Services/AnimalWeightService';
import CreateAnimalDocumentValidator from 'App/Validators/Timeline/CreateAnimalDocumentValidator';
import CreateAnimalObservationValidator from 'App/Validators/Timeline/CreateAnimalObservationValidator';
import CreateAnimalWeightValidator from 'App/Validators/Timeline/CreateAnimalWeightValidator';

@inject()
export default class TimelinesController {
  constructor(
    private readonly animalWeightService: AnimalWeightService,
    private readonly animalObservationService: AnimalObservationService,
    private readonly animalDocumentService: AnimalDocumentService,
  ) {}

  public async animalWeightIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.animalWeightService.index(params.id));
  }

  public async animalWeightStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalWeightValidator);
    await this.animalWeightService.store(payload);
    return response.created();
  }

  public async animalObservationIndex({
    params,
    response,
  }: HttpContextContract) {
    return response.ok(await this.animalObservationService.index(params.id));
  }

  public async animalObservationStore({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalObservationValidator);
    await this.animalObservationService.store(payload);
    return response.created();
  }

  public async animalDocumentIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.animalDocumentService.index(params.id));
  }

  public async animalDocumentStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalDocumentValidator);
    await this.animalDocumentService.store(payload);
    return response.created();
  }
}
