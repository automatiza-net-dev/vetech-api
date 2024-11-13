import { inject } from "@adonisjs/fold";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PatientService from "App/Services/PatientService";
import SharedService from "App/Services/SharedService";
import CreatePatientSupplierValidator from "App/Validators/Patient/CreatePatientSupplierValidator";
import UpdatePatientSupplierValidator from "App/Validators/Patient/UpdatePatientSupplierValidator";

@inject()
export default class PatientSuppliersController {
	constructor(
		private readonly service: PatientService,
		private readonly sharedService: SharedService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const qs = request.qs();
		const patients = await this.service.supplierIndex(
			await this.sharedService.getAuthContext(auth),
			{
				name: qs.name,
				document: qs.document,
			},
		);

		return response.ok(patients);
	}

	public async show({ auth, params, response }: HttpContextContract) {
		const patients = await this.service.show(
			await this.sharedService.getAuthContext(auth),
			params.id,
		);

		return response.ok(patients);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreatePatientSupplierValidator);

		const supplier = await this.service.storeSupplier(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created(supplier);
	}

	public async update({
		auth,
		params,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdatePatientSupplierValidator);

		const supplier = await this.service.updateSupplier(
			await this.sharedService.getAuthContext(auth),
			params.id,
			payload,
		);

		return response.ok(supplier);
	}
}
