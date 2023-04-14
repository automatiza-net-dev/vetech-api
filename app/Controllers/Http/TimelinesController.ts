import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import TimelineService from 'App/Services/TimelineService';
import CreateAnimalAppointmentValidator from 'App/Validators/Timeline/CreateAnimalAppointmentValidator';
import CreateAnimalDischargeValidator from 'App/Validators/Timeline/CreateAnimalDischargeValidator';
import CreateAnimalDocumentValidator from 'App/Validators/Timeline/CreateAnimalDocumentValidator';
import CreateAnimalExamValidator from 'App/Validators/Timeline/CreateAnimalExamValidator';
import CreateAnimaGlycemiaValidator from 'App/Validators/Timeline/CreateAnimalGlycemiaValidator';
import CreateAnimalMedicalRecipeValidator from 'App/Validators/Timeline/CreateAnimalMedicalRecipeValidator';
import CreateAnimalObservationValidator from 'App/Validators/Timeline/CreateAnimalObservationValidator';
import CreateAnimalPathologyValidator from 'App/Validators/Timeline/CreateAnimalPathologyValidator';
import CreateAnimalPhotoValidator from 'App/Validators/Timeline/CreateAnimalPhotoValidator';
import CreateAnimaPressureValidator from 'App/Validators/Timeline/CreateAnimalPressureValidator';
import CreateAnimalWeightValidator from 'App/Validators/Timeline/CreateAnimalWeightValidator';
import UpsertAnimalVaccineValidator from 'App/Validators/Timeline/UpsertAnimalVaccineValidator';

@inject()
export default class TimelinesController {
  constructor(private readonly timelineService: TimelineService) {}

  public async index({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.all(params.id));
  }

  public async patientPressureIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.pressureIndex(params.id));
  }

  public async storePatientPressure({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimaPressureValidator);
    await this.timelineService.storePressure(payload);
    return response.created();
  }

  public async patientGlycemiaIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.glycemiaIndex(params.id));
  }

  public async storePatientGlycemia({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimaGlycemiaValidator);
    await this.timelineService.storeGlycemia(payload);
    return response.created();
  }

  public async animalWeightIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.weightIndex(params.id));
  }

  public async storeAnimalWeight({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalWeightValidator);
    await this.timelineService.storeWeight(payload);
    return response.created();
  }

  public async updateAnimalWeight({
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalWeightValidator);
    await this.timelineService.updateWeight(params.id, payload);
    return response.noContent();
  }

  public async animalDocumentIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.documentIndex(params.id));
  }

  public async storeAnimalDocument({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalDocumentValidator);
    await this.timelineService.storeDocument(payload);
    return response.created();
  }

  public async updateAnimalDocument({
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalDocumentValidator);
    await this.timelineService.updateDocument(params.id, payload);
    return response.created();
  }

  public async animalPathologyIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.pathologyIndex(params.id));
  }

  public async storeAnimalPathology({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalPathologyValidator);
    await this.timelineService.storePathology(payload);
    return response.created();
  }

  public async updateAnimalPathology({
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalPathologyValidator);
    await this.timelineService.updatePathology(params.id, payload);
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

  public async storeAnimalMedicalRecipe({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalMedicalRecipeValidator);
    await this.timelineService.storeMedicalRecipe(payload);
    return response.created();
  }

  public async updateAnimalMedicalRecipe({
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalMedicalRecipeValidator);
    await this.timelineService.updateMedicalRecipe(params.id, payload);
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

  public async deleteAnimalPhoto({ params, response }: HttpContextContract) {
    await this.timelineService.deletePhoto(params.id);
    return response.noContent();
  }

  public async animalVaccineIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.vaccineIndex(params.id));
  }

  public async animalVaccineStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(UpsertAnimalVaccineValidator);
    await this.timelineService.storeVaccine(payload);
    return response.created();
  }

  public async updateAnimalVaccine({
    params,
    request,
    response,
  }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpsertAnimalVaccineValidator);
    await this.timelineService.updateVaccine(id, payload);
    return response.noContent();
  }

  public async animalExamIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.examIndex(params.id));
  }

  public async animalExamStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalExamValidator);
    await this.timelineService.storeExam(payload);
    return response.created();
  }

  public async appointmentsIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.appointmentIndex(params.id));
  }

  public async appointmentsStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalAppointmentValidator);
    await this.timelineService.storeAppointment(payload);
    return response.created();
  }

  public async hospitalizationIndex({ params, response }: HttpContextContract) {
    return response.ok(
      await this.timelineService.hospitalizationIndex(params.id),
    );
  }

  // public async hospitalizationStore({
  //   request,
  //   response,
  // }: HttpContextContract) {
  //   const payload = await request.validate(
  //     CreateAnimalHospitalizationValidator,
  //   );
  //   await this.timelineService.storeHospitalization(payload);
  //   return response.created();
  // }

  public async dischargeStore({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalDischargeValidator);
    await this.timelineService.storeDischarge(payload);
    return response.created();
  }

  public async observationsIndex({ params, response }: HttpContextContract) {
    return response.ok(await this.timelineService.observationsIndex(params.id));
  }

  public async storeObservation({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalObservationValidator);
    await this.timelineService.storeObservations(payload);
    return response.created();
  }

  public async updateObservations({
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateAnimalObservationValidator);
    await this.timelineService.updateObservations(params.id, payload);
    return response.created();
  }
}
