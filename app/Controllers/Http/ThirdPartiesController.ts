import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SharedService from "App/Services/SharedService";
import ThirdPartyService from "App/Services/ThirdPartyService";
import AuthenticateThirdPartyValidator from "App/Validators/ThirdParty/AuthenticateThirdPartyValidator";
import ExtendedAuthenticateThirdPartyValidator from "App/Validators/ThirdParty/ExtendedAuthenticateThirdPartyValidator";
import SyncProfileAccessValidator from "App/Validators/ThirdParty/SyncProfileAccessValidator";
import UnitLoginValidator from "App/Validators/ThirdParty/UnitLoginValidator";

@inject()
export default class ThirdPartiesController {
	constructor(
		private readonly service: ThirdPartyService,
		private sharedService: SharedService,
	) {}

	public async authenticateSancla({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(AuthenticateThirdPartyValidator);

		const result = await this.service.authenticate(auth, "Sanclá", payload);

		return response.ok(result);
	}

	public async authenticateVetech({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(AuthenticateThirdPartyValidator);

		const result = await this.service.authenticate(auth, "Vetech", payload);

		return response.ok(result);
	}

	public async authenticateLiftOne({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(AuthenticateThirdPartyValidator);

		const result = await this.service.authenticate(auth, "LiftOne", payload);

		return response.ok(result);
	}

	public async extendedAuthenticateSancla({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(
			ExtendedAuthenticateThirdPartyValidator,
		);

		const result = await this.service.extendedAuthenticate(
			auth,
			"Sanclá",
			payload,
		);

		return response.ok(result);
	}

	public async extendedAuthenticateLiftOne({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(
			ExtendedAuthenticateThirdPartyValidator,
		);

		const result = await this.service.extendedAuthenticate(
			auth,
			"LiftOne",
			payload,
		);

		return response.ok(result);
	}

	public async extendedAuthenticateVetech({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(
			ExtendedAuthenticateThirdPartyValidator,
		);

		const result = await this.service.extendedAuthenticate(
			auth,
			"Vetech",
			payload,
		);

		return response.ok(result);
	}

	public async updateToken({ request, auth, response }: HttpContextContract) {
		const payload = await request.validate(UnitLoginValidator);

		const { user } = auth.use("tpApi");
		const result = await this.service.updateToken(user!, payload);

		return response.ok(result);
	}

	public async profile({ auth, response }: HttpContextContract) {
		const user = auth.use("tpApi").user!;

		return response.ok({
			id: user.id,
			key: user.key,
		});
	}

	public async businessUnitInfo({ params, response }: HttpContextContract) {
		return response.ok(await this.service.businessUnitInfo(params.id));
	}

	public async userInfo({ params, response }: HttpContextContract) {
		return response.ok(await this.service.userInfo(params.id));
	}

	public async searchProfileAccesses({ auth, response }: HttpContextContract) {
		return response.ok(
			await this.service.searchProfileAccesses(
				await this.sharedService.getAuthContext(auth),
			),
		);
	}

	public async syncProfileAccesses({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(SyncProfileAccessValidator);

		await this.service.syncProfileAccesses(
			await this.sharedService.getAuthContext(auth),
			payload,
		);

		return response.noContent();
	}
}
