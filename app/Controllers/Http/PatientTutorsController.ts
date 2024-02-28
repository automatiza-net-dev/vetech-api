import { inject } from "@adonisjs/fold";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PatientService from "App/Services/PatientService";
import SharedService from "App/Services/SharedService";
import AssignPatientTutorValidator from "App/Validators/Patient/AssignPatientTutorValidator";
import CreateLiftOneTutorForGenericValidator from "App/Validators/Patient/CreateLiftOneTutorForGenericValidator";
import CreateLiftOneTutorForRegisterValidator from "App/Validators/Patient/CreateLiftOneTutorForRegisterValidator";
import CreatePatientWithTutorValidator from "App/Validators/Patient/CreatePatientWithTutorValidator";
import CreateSanclaTutorForGenericValidator from "App/Validators/Patient/CreateSanclaTutorForGenericValidator";
import CreateSanclaTutorForRegisterValidator from "App/Validators/Patient/CreateSanclaTutorForRegisterValidator";
import UpdateLiftOneTutorForGenericValidator from "App/Validators/Patient/UpdateLiftOneTutorForGenericValidator";
import UpdateLiftOneTutorForRegisterValidator from "App/Validators/Patient/UpdateLiftOneTutorForRegisterValidator";
import UpdatePatientWithTutorValidator from "App/Validators/Patient/UpdatePatientWithTutorValidator";
import UpdateSanclaTutorForGenericValidator from "App/Validators/Patient/UpdateSanclaTutorForGenericValidator";
import UpdateSanclaTutorForRegisterValidator from "App/Validators/Patient/UpdateSanclaTutorForRegisterValidator";
import IPatientTutorData from "Contracts/interfaces/IPatientTutorData";

@inject()
export default class PatientTutorsController {
	constructor(
		private readonly service: PatientService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const qs = request.qs();
		const patients = await this.service.tutorsIndex(unit_id, {
			name: qs.name,
			document: qs.document,
			patient: qs.patient,
			phone: qs.phone,
			race: qs.race,
		});

		return response.ok(patients);
	}

	public async reducedIndex({ auth, request, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);
		const qs = request.qs();
		const patients = await this.service.reducedTutorsIndex(unit_id, {
			name: qs.name,
			document: qs.document,
			patient: qs.patient,
			phone: qs.phone,
			race: qs.race,
		});

		return response.ok(patients);
	}

	public async notRelated({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const patients = await this.service.tutorNonPatients(unit_id, params.id);

		return response.ok(patients);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const { unit_id } = this.sharedService.extractUser(auth);

		const patients = await this.service.show(unit_id, params.id);

		return response.ok(patients);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);

		const origin = request.input("origin");
		let data: Omit<IPatientTutorData, "active"> | null = null;

		if (origin === "" || origin === "Cadastro") {
			if (authCtx.system.name === "Sanclá") {
				data = await request.validate(CreateSanclaTutorForRegisterValidator);
			}

			if (authCtx.system.name === "LiftOne") {
				data = await request.validate(CreateLiftOneTutorForRegisterValidator);
			}
		}

		if (origin === "Crm" || origin === "Agenda") {
			if (authCtx.system.name === "Sanclá") {
				data = await request.validate(CreateSanclaTutorForGenericValidator);
			}

			if (authCtx.system.name === "LiftOne") {
				data = await request.validate(CreateLiftOneTutorForGenericValidator);
			}
		}

		if (!data) {
			data = await request.validate(CreatePatientWithTutorValidator);
		}

		const { unit_id } = this.sharedService.extractUser(auth);

		const patient = await this.service.storeTutor(unit_id, data);

		return response.created(patient);
	}

	public async assign({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(AssignPatientTutorValidator);
		const { unit_id } = this.sharedService.extractUser(auth);

		await this.service.assignPatientTutor(unit_id, payload);

		return response.created();
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const authCtx = await this.sharedService.getAuthContext(auth);
		const { unit_id } = this.sharedService.extractUser(auth);

		const origin = request.input("origin");

		let data: IPatientTutorData | null = null;

		if (origin === "" || origin === "Cadastro") {
			if (authCtx.system.name === "Sanclá") {
				data = await request.validate(UpdateSanclaTutorForRegisterValidator);
			}

			if (authCtx.system.name === "LiftOne") {
				data = await request.validate(UpdateLiftOneTutorForRegisterValidator);
			}
		}

		if (origin === "Crm" || origin === "Agenda") {
			if (authCtx.system.name === "Sanclá") {
				data = await request.validate(UpdateSanclaTutorForGenericValidator);
			}

			if (authCtx.system.name === "LiftOne") {
				data = await request.validate(UpdateLiftOneTutorForGenericValidator);
			}
		}

		if (!data) {
			data = await request.validate(UpdatePatientWithTutorValidator);
		}

		const patient = await this.service.updateTutor(unit_id, params.id, data);

		return response.ok(patient);
	}
}
