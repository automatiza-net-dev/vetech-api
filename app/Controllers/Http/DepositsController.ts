import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import DepositService from "App/Services/DepositService";
import SharedService from "App/Services/SharedService";
import CreateDepositItemValidator from "App/Validators/Deposit/CreateDepositItemValidator";
import CreateDepositMovementValidator from "App/Validators/Deposit/CreateDepositMovementValidator";
import CreateDepositValidator from "App/Validators/Deposit/CreateDepositValidator";
import UpdateDepositItemValidator from "App/Validators/Deposit/UpdateDepositItemValidator";
import UpdateDepositValidator from "App/Validators/Deposit/UpdateDepositValidator";

@inject()
export default class DepositsController {
	constructor(
		private readonly sharedService: SharedService,
		private readonly service: DepositService,
	) {}

	public async searchDeposits({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.searchDeposits(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async showDeposit({ auth, request, response }: HttpContextContract) {
		const result = await this.service.showDeposit(
			await this.sharedService.getAuthContext(auth),
			request.param("id"),
		);

		return response.ok(result);
	}

	public async createDeposit({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateDepositValidator);

		await this.service.createDeposit(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created();
	}

	public async updateDeposit({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(UpdateDepositValidator);

		await this.service.updateDeposit(
			await this.sharedService.getAuthContext(auth),
			request.param("id"),
			payload,
		);

		return response.noContent();
	}

	public async updatePrincipalDeposit({
		auth,
		request,
		response,
	}: HttpContextContract) {
		await this.service.updatePrincipalDeposit(
			await this.sharedService.getAuthContext(auth),
			request.param("id"),
		);

		return response.noContent();
	}

	public async createDepositItem({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateDepositItemValidator);

		await this.service.createDepositItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.created();
	}

	public async updateDepositItem({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(UpdateDepositItemValidator);

		await this.service.updateDepositItem(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}

	public async searchDepositMovements({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.searchDepositMovements(
			await this.sharedService.getAuthContext(auth),
			request.qs(),
		);

		return response.ok(result);
	}

	public async showDepositMovements({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const result = await this.service.showDepositMovement(
			await this.sharedService.getAuthContext(auth),
			{
				ids: request.qs().ids,
			},
		);

		return response.ok(result);
	}

	public async createDepositMovement({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(CreateDepositMovementValidator);

		const result = await this.service.createDepositMovement(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		if (Array.isArray(result)) {
			return response.badRequest(result);
		}

		return response.created();
	}
}
