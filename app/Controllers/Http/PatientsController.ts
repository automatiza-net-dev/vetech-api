import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PatientService from "App/Services/PatientService";
import SharedService from "App/Services/SharedService";
import CheckPhoneValidator from "App/Validators/Patient/CheckPhoneValidator";
import CreatePatientValidator from "App/Validators/Patient/CreatePatientValidator";
import DeclareDeathValidator from "App/Validators/Patient/DeclareDeathValidator";
import FastCreatePatientValidator from "App/Validators/Patient/FastCreatePatientValidator";
import UpdatePatientValidator from "App/Validators/Patient/UpdatePatientValidator";
import ISearchPatient from "Contracts/interfaces/ISearchPatient";

@inject()
export default class PatientsController {
	constructor(
		private readonly service: PatientService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const qs = request.qs();
		const patients = await this.service.index(unit_id, {
			name: qs.name,
			gender: qs.gender,
			type: qs.type,
		});

		return response.ok(patients);
	}

	public async nonPets({ auth, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const result = await this.service.nonPets(unit_id);

		return response.ok(result);
	}

	public async uniqueOrigins({ auth, response }: HttpContextContract) {
		const result = await this.service.uniqueOrigins(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const patients = await this.service.show(unit_id, params.id);

		return response.ok(patients);
	}

	public async display({ auth, params, response }: HttpContextContract) {
		try {
			const patients = await this.service.display(
				await this.sharedService.getAuthContext(auth),
				params.id,
			);

			return response.ok(patients);
		} catch (e) {
			return response.badRequest({
				data: null,
				status: 400,
				title: "Requisição inválida",
				message: e.message.split(":")?.at(1).trim() ?? "Algo deu errado",
				validationErrors: {},
			});
		}
	}

	public async checkDocument({ params, response, auth }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const { document } = params;
		const result = await this.service.checkExistingDocument(unit_id, document);

		return response.ok(result);
	}

	public async checkPhone({ request, response, auth }: HttpContextContract) {
		const payload = await request.validate(CheckPhoneValidator);
		const result = await this.service.checkExistingPhone(
			await this.sharedService.getAuthContext(auth),
			payload.phone,
		);

		return response.ok(result);
	}

	public async metadata({ auth, params, response }: HttpContextContract) {
		const data = await this.service.metadata(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(data);
	}

	public async salesMetadata({ auth, params, response }: HttpContextContract) {
		const data = await this.service.salesMetadata(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(data);
	}

	public async search({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const qs = request.qs();

		const data = {
			tutor: qs.tutor,
			patient: qs.patient,
		} as ISearchPatient;

		const patients = await this.service.search(unit_id, data);

		return response.ok(patients);
	}

	public async showAnimals({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const qs = request.qs();
		const patients = await this.service.animalsIndex(unit_id, {
			name: qs.name,
			race: qs.race,
			specie: qs.specie,
			tutor: qs.tutor,
			document: qs.document,
			phone: qs.phone,
			tag: qs.tag,
		});

		return response.ok(patients);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreatePatientValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		const patient = await this.service.store(unit_id, payload);

		return response.created(patient);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdatePatientValidator);

		const patient = await this.service.update(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.ok(patient);
	}

	public async declareDeath({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(DeclareDeathValidator);

		await this.service.declareDeath(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.noContent();
	}

	public async destroy({ auth, params, response }: HttpContextContract) {
		await this.service.destroy(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.noContent();
	}

	public async setMainTutor({ auth, params, response }: HttpContextContract) {
		await this.service.setMainTutor(
			await this.sharedService.getAuthContext(auth),
			params.patient,
			params.tutor,
		);

		return response.noContent();
	}

	public async fastStore({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(FastCreatePatientValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		const result = await this.service.fastStore(unit_id, payload);

		return response.created(result);
	}
}
