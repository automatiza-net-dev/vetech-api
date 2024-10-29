import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PatientService from "App/Services/PatientService";
import SharedService from "App/Services/SharedService";
import CheckPhoneValidator from "App/Validators/Patient/CheckPhoneValidator";
import CreateCrmPatientValidator from "App/Validators/Patient/CreateCrmPatientValidator";
import CreatePatientValidator from "App/Validators/Patient/CreatePatientValidator";
import CreateSchedulePatientValidator from "App/Validators/Patient/CreateSchedulePatientValidator";
import DeclareDeathValidator from "App/Validators/Patient/DeclareDeathValidator";
import FastCreatePatientValidator from "App/Validators/Patient/FastCreatePatientValidator";
import UnlinkTutorPatientValidator from "App/Validators/Patient/UnlinkTutorPatientValidator";
import UpdatePatientValidator from "App/Validators/Patient/UpdatePatientValidator";
import ISearchPatient from "Contracts/interfaces/ISearchPatient";

@inject()
export default class PatientsController {
	constructor(
		private readonly service: PatientService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const patients = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(patients);
	}

	public async nonPets({ auth, response }: HttpContextContract) {
		const result = await this.service.nonPets(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	public async uniqueOrigins({ auth, response }: HttpContextContract) {
		const result = await this.service.uniqueOrigins(
			await this.sharedService.getAuthContext(auth),
		);

		return response.ok(result);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const patients = await this.service.show(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(patients);
	}

	public async display({ auth, params, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const patients = await this.service.display(
				await this.sharedService.getAuthContext(auth),
				params.id,
			);

			return response.ok(patients);
		});
	}

	public async checkDocument({ params, response, auth }: HttpContextContract) {
		const { document } = params;
		const result = await this.service.checkExistingDocument(
			await this.sharedService.getAuthContext(auth),
			document,
		);

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
		const qs = request.qs();

		const data = {
			tutor: qs.tutor,
			patient: qs.patient,
		} as ISearchPatient;

		const patients = await this.service.search(
			await this.sharedService.getAuthContext(auth),
			data,
		);

		return response.ok(patients);
	}

	public async showAnimals({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const patients = await this.service.animalsIndex(
			await this.sharedService.getAuthContext(auth),
			{
				name: qs.name,
				race: qs.race,
				specie: qs.specie,
				tutor: qs.tutor,
				document: qs.document,
				phone: qs.phone,
				tag: qs.tag,
			},
		);

		return response.ok(patients);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const origin = request.input("origin", "");

			if (origin === "Agenda") {
				await request.validate(CreateSchedulePatientValidator);
			} else if (origin === "Crm") {
				await request.validate(CreateCrmPatientValidator);
			} else {
				await request.validate(CreatePatientValidator);
			}

			const patient = await this.service.store(
				await this.sharedService.getAuthContext(auth),
				// @ts-expect-error
				request.body(),
			);

			return response.created(patient);
		});
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(UpdatePatientValidator);

			const patient = await this.service.update(
				await this.sharedService.getAuthContext(auth),
				params.id,
				payload,
			);

			return response.ok(patient);
		});
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

		const result = await this.service.fastStore(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(result);
	}

	public async unlinkHolderDependent({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UnlinkTutorPatientValidator);

		await this.service.unlinkHolderDependent(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}
}
