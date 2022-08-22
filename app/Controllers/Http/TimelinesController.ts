import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import TimelineService from 'App/Services/TimelineService';
import CreateAnimalDocumentValidator from 'App/Validators/Timeline/CreateAnimalDocumentValidator';
import CreateAnimalObservationValidator from 'App/Validators/Timeline/CreateAnimalObservationValidator';
import CreateAnimalWeightValidator from 'App/Validators/Timeline/CreateAnimalWeightValidator';

@inject()
export default class TimelinesController {
  constructor(private readonly timelineService: TimelineService) {}

  public async animalWeightIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.weightIndex(params.id));
  }

  public async animalWeightStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalWeightValidator);
    await this.timelineService.storeWeight(payload);
    return response.created();
  }

  public async animalObservationIndex({
    params,
    response,
  }: HttpContextContract) {
    return response.ok(await this.timelineService.observationIndex(params.id));
  }

  public async animalObservationStore({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalObservationValidator);
    await this.timelineService.storeObservation(payload);
    return response.created();
  }

  public async animalDocumentIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.documentIndex(params.id));
  }

  public async animalDocumentStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalDocumentValidator);
    await this.timelineService.storeDocument(payload);
    return response.created();
  }

  // public async animalPathologyIndex({ params, response }: HttpContextContract) {
  //   return response.ok(await this.animalPathologyService.index(params.id));
  // }

  // public async animalPathologyStore({
  //   request,
  //   response,
  // }: HttpContextContract) {
  //   const payload = await request.validate(CreateAnimalPathologyValidator);
  //   await this.animalPathologyService.store(payload);
  //   return response.created();
  // }

  // public async animalMedicalRecipeIndex({
  //   params,
  //   response,
  // }: HttpContextContract) {
  //   return response.ok(await this.animalMedicalRecipeService.index(params.id));
  // }

  // public async animalMedicalRecipeStore({
  //   request,
  //   response,
  // }: HttpContextContract) {
  //   const payload = await request.validate(CreateAnimalMedicalRecipeValidator);
  //   await this.animalMedicalRecipeService.store(payload);
  //   return response.created();
  // }

  // public async animalPhotoIndex({ params, response }: HttpContextContract) {
  //   return response.ok(await this.animalPhotoService.index(params.id));
  // }

  // public async animalPhotoStore({ request, response }: HttpContextContract) {
  //   const payload = await request.validate(CreateAnimalPhotoValidator);
  //   await this.animalPhotoService.store(payload);
  //   return response.created();
  // }
}
