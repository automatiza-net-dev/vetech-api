import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnit from "App/Models/BusinessUnit";
import ThirdPartyService from "App/Services/ThirdPartyService";
import AuthenticateThirdPartyValidator from "App/Validators/ThirdParty/AuthenticateThirdPartyValidator";
import ExtendedAuthenticateThirdPartyValidator from "App/Validators/ThirdParty/ExtendedAuthenticateThirdPartyValidator";
import SyncProfileAccessValidator from "App/Validators/ThirdParty/SyncProfileAccessValidator";
import UnitLoginValidator from "App/Validators/ThirdParty/UnitLoginValidator";

@inject()
export default class ThirdPartiesController {
	constructor(private readonly service: ThirdPartyService) {}

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
		const { user } = auth.use("api");
		if (!user) {
			throw new BadRequestException("Usuário não encontrado", 400, "E_NO_USER");
		}

		const { unit_id } = auth.use("api").token!.meta;

		const unit = unit_id
			? await BusinessUnit.query()
					.select("id", "identification")
					.where("id", unit_id)
					.firstOrFail()
			: null;

		return response.ok({
			user: {
				id: user.id,
				name: user.name,
			},
			unit,
		});
	}

	public async tpProfile({ auth, response }: HttpContextContract) {
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
			await this.service.searchProfileAccesses(auth.user?.system_id ?? -1),
		);
	}

	public async syncProfileAccesses({ request, response }: HttpContextContract) {
		const payload = await request.validate(SyncProfileAccessValidator);

		await this.service.syncProfileAccesses(payload);

		return response.noContent();
	}
}
