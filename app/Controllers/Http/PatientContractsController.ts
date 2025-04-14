import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import ContractService from "App/Services/ContractService";
import SharedService from "App/Services/SharedService";
import CreateClientContractValidator from "App/Validators/PatientContracts/CreateClientContractValidator";
import CreateContractValidator from "App/Validators/PatientContracts/CreateContractValidator";
import UpdateContractValidator from "App/Validators/PatientContracts/UpdateContractValidator";

@inject()
export default class PatientContractsController {
	constructor(
		private sharedService: SharedService,
		private service: ContractService,
	) {}

	public async index({ auth, request, response }: HttpContextContract) {
		const result = await this.service.index(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async forPatient({ auth, request, response }: HttpContextContract) {
		const result = await this.service.forPatient(
			await this.sharedService.getAuthContext(auth),
			request.param("patientID", "-"),
		);

		return response.ok(result);
	}

	public async clientContract({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateClientContractValidator);

		const result = await this.service.storeClientContract(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(result);
	}

	public async store({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateContractValidator);
		const result = await this.service.store(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(result);
	}

	public async update({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateContractValidator);
		const result = await this.service.update(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.ok(result);
	}

	public async delete({ auth, request, response }: HttpContextContract) {
		await this.service.delete(await this.sharedService.getAuthContext(auth), {
			id: request.param("id", "-1"),
		});

		return response.ok(null);
	}
}
