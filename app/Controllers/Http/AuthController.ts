import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { ValidationException } from "@ioc:Adonis/Core/Validator";
import { inject } from "@adonisjs/fold";
import EconomicGroup from "App/Models/EconomicGroup";
import ThirdPartyUserPermission from "App/Models/ThirdPartyUserPermission";
import AuthService from "App/Services/AuthService";
import SharedService from "App/Services/SharedService";
import UserService from "App/Services/UserService";
import LoginValidator from "App/Validators/Auth/LoginValidator";
import SwapUnitValidator from "App/Validators/Auth/SwapUnitValidator";
import CreateUserValidator from "App/Validators/User/CreateUserValidator";
import ForgotPasswordValidator from "App/Validators/User/ForgotPasswordValidator";
import ResetPasswordValidator from "App/Validators/User/ResetPasswordValidator";
import BadRequestException from "App/Exceptions/BadRequestException";

@inject()
export default class AuthController {
	constructor(
		private readonly service: UserService,
		private readonly authService: AuthService,
		private readonly sharedService: SharedService,
	) {}

	public async login({ auth, request, response }: HttpContextContract) {
		const payload = await request.validate(LoginValidator);

		const result = await this.authService.login(payload, auth);

		if (typeof result.at(1) === "number") {
			response.cookie("sid", result.at(1));
			return response.ok(result.at(0));
		}

		return response.ok(result);
	}

	public async controllerLogin({
		auth,
		request,
		response,
	}: HttpContextContract) {
		const payload = await request.validate(LoginValidator);

		const result = await this.authService.controllerLogin(payload, auth);

		return response.ok(result);
	}

	public async adminLogin({ auth, request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const payload = await request.validate(LoginValidator);

			const result = await this.authService.adminLogin(payload, auth);

			return response.ok(result);
		});
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

	public async whoAmI({ auth, response, request }: HttpContextContract) {
		// console.log({ headers: request.headers() });

		const $user = auth.user;
		if ($user instanceof ThirdPartyUserPermission) {
			await $user.load("user");
			await $user.load("system", (query) => {
				query.preload("systemUrls", (query) => {
					query.select(["id", "url", "active"]);
				});
			});
			return response.ok({
				user: $user.user,
				unit: null,
				url: $user.system.systemUrls.at(0) ?? null,
				cl: null,
				isThirdParty: true,
			});
		}

		const { user, unit_id, system_id, ip } =
			this.sharedService.extractUser(auth);
		if (ip) {
			const reqIp = request.qs().ip;
			// TODO flip
			if (reqIp) {
				if (reqIp !== ip) {
					return response.unauthorized({
						errors: [
							{
								message: "E_UNAUTHORIZED_ACCESS: Unauthorized access",
							},
						],
					});
				}
			}
		}

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
				isThirdParty: false,
			});
		}

		const { unit, system, group } =
			await this.sharedService.getAuthContext(auth);

		if (group.status === "Inativo") {
			throw new BadRequestException(
				"Login Invalido - Sistema Inativo",
				400,
				"E_ERR",
			);
		}

		if (group.status === "Bloqueado") {
			throw new BadRequestException(
				"Login Bloqueado - Entre em contato com a Automatiza",
				400,
				"E_ERR",
			);
		}

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
				"alter_prices",
				"requires_client_document",
				"schedule_late_minutes",
				"schedule_missed_minutes",
				"integrates_to_crm_schedules",
				"generates_finances_on_receipts_finish",
				"treatment",
				"crm_useful_days",
				"reviewer",
				"internal_code",
				"sync_schedule_movements",
				"sync_crm_schedules",
				"budgets_payments_required",
				"config",
			]);
		});

		return response.ok({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				document: user.document,
				phone: user.phone,
				profile_picture: user.profilePicture ?? null,
				postal_code: user.postalCode,
				address: user.address,
				number: user.number,
				complement: user.complement,
				district: user.district,
				city: user.city,
				state: user.state,
				licensing_job: user.licensingJob,
				inscription: user.inscription,
				birth_date: user.birthDate,
				on_duty: user.onDuty,
				type: user.type,
			},
			unit: {
				id: unit.id,
				unitConfig: {
					interval: unit.unitConfig.interval,
					alter_prices: unit.unitConfig.alterPrices ?? false,
					requires_client_document:
						unit.unitConfig.requiresClientDocument ?? false,
					allow_change_schedule_duration:
						unit.unitConfig.allowChangeScheduleDuration ?? false,
					reviewer: unit.unitConfig.reviewer,
					internalCode: unit.unitConfig.internalCode,
					syncScheduleMovements: unit.unitConfig.syncScheduleMovements,
					syncCrmSchedules: unit.unitConfig.syncCrmSchedules,
					budgetsPaymentsRequired: unit.unitConfig.budgetsPaymentsRequired,
				},
				configs: unit.unitConfig.config,
				phone: unit.phone,
				fantasy_name: unit.fantasyName,
				address: unit.address,
				complement: unit.complement,
				district: unit.district,
				city: unit.city,
				state: unit.state,
				economicGroup: { id: unit.economicGroupId },
				system: {
					id: system.id,
					type: system.type,
				},
			},
			cl: await this.authService.getUserACL(
				user,
				system_id,
				unit.id,
				group.status === "Consulta",
			),
			isThirdParty: false,
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
