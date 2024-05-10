import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import TimelineService from "App/Services/TimelineService";
import AddAttachmentsValidator from "App/Validators/Timeline/AddAttachmentsValidator";
import CreateAnimalAppointmentValidator from "App/Validators/Timeline/CreateAnimalAppointmentValidator";
import CreateAnimalDeathValidator from "App/Validators/Timeline/CreateAnimalDeathValidator";
import CreateAnimalDischargeValidator from "App/Validators/Timeline/CreateAnimalDischargeValidator";
import CreateAnimalDocumentValidator from "App/Validators/Timeline/CreateAnimalDocumentValidator";
import CreateAnimalExamValidator from "App/Validators/Timeline/CreateAnimalExamValidator";
import CreateAnimaGlycemiaValidator from "App/Validators/Timeline/CreateAnimalGlycemiaValidator";
import CreateAnimalMedicalRecipeValidator from "App/Validators/Timeline/CreateAnimalMedicalRecipeValidator";
import CreateAnimalObservationValidator from "App/Validators/Timeline/CreateAnimalObservationValidator";
import CreateAnimalPathologyValidator from "App/Validators/Timeline/CreateAnimalPathologyValidator";
import CreateAnimalPhotoValidator from "App/Validators/Timeline/CreateAnimalPhotoValidator";
import CreateAnimaPressureValidator from "App/Validators/Timeline/CreateAnimalPressureValidator";
import CreateAnimalWeightValidator from "App/Validators/Timeline/CreateAnimalWeightValidator";
import CreatePatientEvaluationValidator from "App/Validators/Timeline/CreatePatientEvaluation";
import UpdateAnimalPhotoValidator from "App/Validators/Timeline/UpdateAnimalPhotoValidator";
import UpsertAnimalVaccineValidator from "App/Validators/Timeline/UpsertAnimalVaccineValidator";

@inject()
export default class TimelinesController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly timelineService: TimelineService,
	) {}

	public async index({ params, response }: HttpContextContract) {
		return response.ok(await this.timelineService.all(params.id));
	}

	public async delete({ auth, params, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			return response.ok(
				await this.timelineService.softDeleteRecord(
					await this.sharedService.getAuthContext(auth),
					params.id,
				),
			);
		});
	}

	public async patientEvaluationIndex({
		params,
		response,
	}: HttpContextContract) {
		return response.ok(await this.timelineService.evaluationIndex(params.id));
	}

	public async storePatientEvaluation({
		request,
		response,
		auth,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreatePatientEvaluationValidator);
			const result = await this.timelineService.storeEvaluation(
				await this.sharedService.getAuthContext(auth),
				payload,
			);
			return response.created(result);
		});
	}

	public async updatePatientEvaluation({
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreatePatientEvaluationValidator);
			await this.timelineService.updateEvaluation(params.id, payload);
			return response.noContent();
		});
	}

	public async deletePatientEvaluationPhoto({
		params,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			await this.timelineService.deleteEvaluationPhoto(params.id, params.index);
			return response.noContent();
		});
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
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateAnimalPhotoValidator);
			await this.timelineService.storePhoto(payload);
			return response.created();
		});
	}

	public async updateAnimalPhoto({
		request,
		response,
		params,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdateAnimalPhotoValidator);
			await this.timelineService.updatePhoto(params.id, payload);
			return response.created();
		});
	}

	public async addAnimalPhotoAttachments({
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(AddAttachmentsValidator);
			await this.timelineService.addPhotoAttachment(params.id, payload);
			return response.created();
		});
	}

	public async deleteAnimalPhotoAttachments({
		params,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			await this.timelineService.deletePhotoAttachment(params.id, params.index);
			return response.created();
		});
	}

	public async deleteAnimalPhoto({ params, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			await this.timelineService.deletePhoto(params.id);
			return response.noContent();
		});
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

	public async appointmentsIndex({
		auth,
		params,
		response,
	}: HttpContextContract) {
		return response.ok(
			await this.timelineService.appointmentIndex(
				await this.sharedService.getAuthContext(auth),
				params.id,
			),
		);
	}

	public async appointmentsStore({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateAnimalAppointmentValidator);
		await this.timelineService.storeAppointment(
			await this.sharedService.getAuthContext(auth),
			payload,
		);
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
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateAnimalObservationValidator);
			await this.timelineService.storeObservations(payload);
			return response.created();
		});
	}

	public async updateObservations({
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateAnimalObservationValidator);
			await this.timelineService.updateObservations(params.id, payload);
			return response.noContent();
		});
	}

	public async deleteObservationMedia({
		params,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			await this.timelineService.deleteObservationMedia(
				params.id,
				params.index,
			);
			return response.noContent();
		});
	}

	public async storeDeath({ request, response, auth }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(CreateAnimalDeathValidator);
			await this.timelineService.storeDeath(
				await this.sharedService.getAuthContext(auth),
				payload,
			);
			return response.created();
		});
	}
}
