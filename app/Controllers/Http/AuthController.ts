import { inject } from "@adonisjs/fold";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import EconomicGroup from "App/Models/EconomicGroup";
import AuthService from "App/Services/AuthService";
import SharedService from "App/Services/SharedService";
import UserService from "App/Services/UserService";
import LoginValidator from "App/Validators/Auth/LoginValidator";
import SwapUnitValidator from "App/Validators/Auth/SwapUnitValidator";
import CreateUserValidator from "App/Validators/User/CreateUserValidator";
import ForgotPasswordValidator from "App/Validators/User/ForgotPasswordValidator";
import ResetPasswordValidator from "App/Validators/User/ResetPasswordValidator";

@inject()
export default class AuthController {
	constructor(
		private readonly service: UserService,
		private readonly authService: AuthService,
		private readonly sharedService: SharedService,
	) {}

	public async login({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(LoginValidator);

		const result = await this.authService.login(
			payload,
			auth,
			payload.ipAddress,
		);

		return response.ok(result);
	}

	public async controllerLogin({
		auth,
		request,
		response,
	}: HttpContextContract) {
		if (process.env.NODE_ENV === "development") {
			console.log(request.headers());
		}

		const payload = await request.validate(LoginValidator);

		const result = await this.authService.controllerLogin(
			payload,
			auth,
			payload.ipAddress,
		);

		return response.ok(result);
	}

	public async adminLogin({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(LoginValidator);

		const result = await this.authService.adminLogin(payload, auth);

		return response.ok(result);
	}

	public async availableSwaps({ auth, response }: HttpContextContract) {
		const { user, system_id } = this.sharedService.extractUser(auth);

		const result = await this.authService.getAvailableSwaps(user, system_id);

		return response.ok(result);
	}

	public async swapUnit({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(SwapUnitValidator);
		const { token } = auth.use("api");
		const { user } = this.sharedService.extractUser(auth);

		await this.authService.swapUnit(user, token!, payload);

		return response.noContent();
	}

	public async swapTpUnit({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(SwapUnitValidator);

		const { token } = auth.use("api");

		await this.authService.swapTpUnit(token!, payload);

		return response.noContent();
	}

	public async register({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(CreateUserValidator);
		const { user, unit, system } = await this.service.store(payload);

		const token = await auth.use("api").generate(user, {
			expiresIn: "7d",
			unit_id: unit.id,
			system_id: system.id,
		});

		return response.created(token);
	}

	public async whoAmI({ auth, response }: HttpContextContract) {
		const { user, unit_id, system_id } = this.sharedService.extractUser(auth);

		if (user.type === "controller") {
			if (!unit_id) {
				return response.ok(
					await this.authService.getControllerWithoutUnit(user, system_id),
				);
			}

			return response.ok(
				await this.authService.getControllerWithUnit(user, unit_id, system_id),
			);
		}

		if (!unit_id) {
			return response.ok({
				user,
				unit: null,
				url: null,
				cl: null,
			});
		}

		const { unit } = await this.sharedService.getAuthContext(auth);

		const economicGroup = await EconomicGroup.query()
			.where("id", unit.economicGroupId)
			.preload("system", (query) => {
				query.preload("systemUrls", (query) => {
					query.select(["id", "url", "active"]);
				});
			})
			.firstOrFail();
		await unit.load("unitConfig", (query) => {
			query.select([
				"id",
				"requires_schedule_tutor",
				"requires_bill_patient",
				"allow_change_schedule_duration",
				"interval",
				"locked_daily_movement_date",
				"daily_cashier_type",
				"requires_finance_client",
			]);
		});

		return response.ok({
			user,
			unit,
			url: economicGroup.system.systemUrls.at(0) ?? null,
			cl: await this.authService.getUserACL(user, system_id, unit.id),
		});
	}

	public async forgotPassword({ request, response }: HttpContextContract) {
		const payload = await request.validate(ForgotPasswordValidator);
		await this.service.forgotPassword(payload);

		return response.noContent();
	}

	public async resetPassword({ request, response }: HttpContextContract) {
		const payload = await request.validate(ResetPasswordValidator);
		await this.service.resetPassword(payload);

		return response.noContent();
	}

	public async logout({ response, auth }: HttpContextContract) {
		try {
			await auth.use("api").revoke();
		} catch (err) {
			console.error(err);
		}

		try {
			await auth.use("tpApi").revoke();
		} catch (err) {
			console.error(err);
		}

		return response.noContent();
	}
}
