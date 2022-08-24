import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import TimelineService from 'App/Services/TimelineService';
import CreateAnimalDocumentValidator from 'App/Validators/Timeline/CreateAnimalDocumentValidator';
import CreateAnimalExamValidator from 'App/Validators/Timeline/CreateAnimalExamValidator';
import CreateAnimalMedicalRecipeValidator from 'App/Validators/Timeline/CreateAnimalMedicalRecipeValidator';
import CreateAnimalObservationValidator from 'App/Validators/Timeline/CreateAnimalObservationValidator';
import CreateAnimalPathologyValidator from 'App/Validators/Timeline/CreateAnimalPathologyValidator';
import CreateAnimalPhotoValidator from 'App/Validators/Timeline/CreateAnimalPhotoValidator';
import CreateAnimalVaccineValidator from 'App/Validators/Timeline/CreateAnimalVaccineValidator';
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

  public async animalPathologyIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.pathologyIndex(params.id));
  }

  public async animalPathologyStore({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalPathologyValidator);
    await this.timelineService.storePathology(payload);
    return response.created();
  }

  public async animalMedicalRecipeIndex({
    params,
    response,
  }: HttpContextContract) {
    return response.ok(
      await this.timelineService.medicalRecipeIndex(params.id),
    );
  }

  public async animalMedicalRecipeStore({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalMedicalRecipeValidator);
    await this.timelineService.storeMedicalRecipe(payload);
    return response.created();
  }

  public async animalPhotoIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.photoIndex(params.id));
  }

  public async animalPhotoStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalPhotoValidator);
    await this.timelineService.storePhoto(payload);
    return response.created();
  }

  public async animalVaccineIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.vaccineIndex(params.id));
  }

  public async animalVaccineStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalVaccineValidator);
    await this.timelineService.storeVaccine(payload);
    return response.created();
  }

  public async animalExamIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.examIndex(params.id));
  }

  public async animalExamStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalExamValidator);
    await this.timelineService.storeExam(payload);
    return response.created();
  }
}
