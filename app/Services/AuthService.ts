import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnit from "App/Models/BusinessUnit";
import EconomicGroup from "App/Models/EconomicGroup";
import { LicenceType } from "App/Models/Licence";
import { TPermissionType } from "App/Models/Permission";
import { TRoleType } from "App/Models/Role";
import System from "App/Models/System";
import User, { TUserType } from "App/Models/User";
import UserUnitRole from "App/Models/UserUnitRole";
import IpAccessControlService from "App/Services/IpAccessControlService";
import ILoginData from "Contracts/interfaces/ILoginData";
import { isAfter } from "date-fns";
import { AuthContract, ProviderTokenContract } from "@ioc:Adonis/Addons/Auth";
import Hash from "@ioc:Adonis/Core/Hash";
import Database from "@ioc:Adonis/Lucid/Database";

@inject()
export default class AuthService {
	constructor(private readonly ipService: IpAccessControlService) {}

	public async getControllerWithoutUnit(user: User, systemID: number) {
		const userRoles = await user
			.related("roles")
			.query()
			.preload("role", (query) => {
				query.whereIn("type", ["controller", "both"] as TRoleType[]);

				query.preload("permissions", (query) => {
					query.where("status", true);

					query.whereIn("type", ["controller", "both"] as TPermissionType[]);
				});
			})
			.whereHas("role", (query) => {
				query.whereIn("type", ["controller", "both"] as TRoleType[]);

				query.whereHas("permissions", (query) => {
					query.where("status", true);

					query.whereIn("type", ["controller", "both"] as TPermissionType[]);
				});
			})
			.whereHas("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", systemID);
				});

				query.where("active", true);
			})
			.where("active", true);

		const controlIds = userRoles.flatMap((r) =>
			r.role.permissions.map((p) => p.control_id),
		);
		const uniqueControls = Array.from(new Set(controlIds));

		return {
			user,
			unit: null,
			url: null,
			cl: uniqueControls,
		};
	}

	public async getControllerWithUnit(
		user: User,
		unitID: string,
		systemID: number,
	) {
		const unit = await BusinessUnit.query()
			.where("id", unitID)
			.preload("economicGroup", (query) => {
				query.preload("system", (query) => {
					query.preload("systemUrls");
				});
			})
			.preload("unitConfig", (query) => {
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
				]);
			})
			.firstOrFail();

		const userRoles = await user
			.related("roles")
			.query()
			.preload("role", (query) => {
				if (user.type === "user") {
					query.whereIn("type", ["user", "both", "all"] as TRoleType[]);
				}
				if (user.type === "controller") {
					query.whereIn("type", ["controller", "both", "all"] as TRoleType[]);
				}
				if (user.type === "system") {
					query.whereIn("type", ["system", "all"] as TRoleType[]);
				}

				query.preload("permissions", (query) => {
					query.where("status", true);

					if (user.type === "user") {
						query.whereIn("type", ["user", "both", "all"] as TPermissionType[]);
					}
					if (user.type === "controller") {
						query.whereIn("type", [
							"controller",
							"both",
							"all",
						] as TPermissionType[]);
					}
					if (user.type === "system") {
						query.whereIn("type", ["system", "all"] as TPermissionType[]);
					}
				});
			})
			.whereHas("role", (query) => {
				if (user.type === "user") {
					query.whereIn("type", ["user", "both", "all"] as TRoleType[]);
				}
				if (user.type === "controller") {
					query.whereIn("type", ["controller", "both", "all"] as TRoleType[]);
				}
				if (user.type === "system") {
					query.whereIn("type", ["system", "all"] as TRoleType[]);
				}

				query.whereHas("permissions", (query) => {
					query.where("status", true);

					if (user.type === "user") {
						query.whereIn("type", ["user", "both", "all"] as TPermissionType[]);
					}
					if (user.type === "controller") {
						query.whereIn("type", [
							"controller",
							"both",
							"all",
						] as TPermissionType[]);
					}
					if (user.type === "system") {
						query.whereIn("type", ["system", "all"] as TPermissionType[]);
					}
				});
			})
			.whereHas("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", systemID);
				});

				query.where("active", true);
			})
			.where("active", true);

		const controlIds = userRoles.flatMap((r) =>
			r.role.permissions.map((p) => p.control_id),
		);
		const uniqueControls = Array.from(new Set(controlIds));

		return {
			user,
			unit,
			url: unit.economicGroup.system.systemUrls.at(0) ?? null,
			cl: uniqueControls,
		};
	}

	public async getUserACL(user: User, sID: number, unitID: string | null) {
		if (!user.type) {
			throw new BadRequestException("Usuário sem tipo", 400, "E_NO_TYPE");
		}

		const qb = Database.from("user_unit_roles")
			.select(Database.raw("distinct permissions.control_id"))
			.join("users", "users.id", "user_unit_roles.user_id")
			.join("roles", "roles.id", "user_unit_roles.role_id")
			.join("role_permissions", "roles.id", "role_permissions.role_id")
			.join("permissions", "role_permissions.permission_id", "permissions.id")
			.join("business_units", "user_unit_roles.unit_id", "business_units.id")
			.join(
				"economic_groups",
				"business_units.economic_group_id",
				"economic_groups.id",
			)
			.where("users.id", user.id)
			.where("economic_groups.system_id", sID)
			.where("roles.active", true)
			.where("role_permissions.active", true)
			.where("role_permissions.status", true)
			.whereNull("permissions.deleted_at");

		if (unitID) {
			qb.where("business_units.id", unitID);
		}

		if (user.type === "user") {
			qb.whereIn("roles.type", ["user", "both", "all"] as TRoleType[]);
			qb.whereIn("permissions.type", [
				"user",
				"both",
				"all",
			] as TPermissionType[]);
		}

		if (user.type === "controller") {
			qb.whereIn("roles.type", ["controller", "both", "all"] as TRoleType[]);
			qb.whereIn("permissions.type", [
				"controller",
				"both",
				"all",
			] as TPermissionType[]);
		}

		if (user.type === "system") {
			qb.whereIn("roles.type", ["system", "all"] as TRoleType[]);
			qb.whereIn("permissions.type", ["system", "all"] as TPermissionType[]);
		}

		const rows = await qb;

		return rows.map((r) => r.control_id);
	}

	public async getRoles(
		user: User,
		sID: number,
		unitID: string | null,
		isLogin: boolean,
	) {
		if (!user.type) {
			throw new BadRequestException("Usuário sem tipo", 400, "E_NO_TYPE");
		}

		const qb = user
			.related("roles")
			.query()
			.preload("role", (query) => {
				query.preload("permissions", (query) => {
					query.where("status", true);

					if (isLogin && user.type === "user") {
						query.where("type", "user");
					}

					if (user.type === "controller") {
						query.where("type", "controller");
					}
				});
			})
			.preload("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", sID);
				});
				query.where("active", true);

				if (unitID) {
					query.where("id", unitID);
				}

				query.preload("economicGroup");
			})
			.whereHas("unit", (query) => {
				if (unitID) {
					query.where("id", unitID);
				}

				query.whereHas("economicGroup", (query) => {
					query.where("system_id", sID);
				});

				query.where("active", true);
			})
			.where("active", true);

		if (user.type === "user") {
			qb.whereHas("role", (query) => {
				query.whereIn("type", ["user", "both"]);
			});
		}

		if (user.type === "controller") {
			qb.whereHas("role", (query) => {
				query.whereIn("type", ["controller", "both"]);
			});
		}

		if (user.type === "system") {
			qb.whereHas("role", (query) => {
				query.whereIn("type", ["system"]);
			});
		}

		return qb;
	}

	public async swapUnit(
		user: User,
		token: ProviderTokenContract,
		data: {
			unitId: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", data.unitId)
				.first();

			if (!unit) {
				throw new BadRequestException(
					"Unidade não encontrada",
					400,
					"E_UNIT_NOT_FOUND",
				);
			}

			const userRoles = await UserUnitRole.query()
				.useTransaction(trx)
				.where("user_id", user.id)
				.where("unit_id", data.unitId)
				.where("active", true);
			if (userRoles.length === 0) {
				throw new BadRequestException(
					"Usuário não possui permissão para acessar a unidade",
					400,
					"E_USER_NOT_ALLOWED",
				);
			}

			const result = (await Database.from("api_tokens")
				.useTransaction(trx)
				.where("id", token.meta?.id ?? -1)
				.update({
					unit_id: data.unitId,
				})) as unknown as number;

			if (result === 0) {
				throw new BadRequestException("Token inválido", 400, "E_INVALID_TOKEN");
			}
		});
	}

	public async swapTpUnit(
		token: ProviderTokenContract,
		data: {
			unitId: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const result = (await Database.from("api_tokens")
				.useTransaction(trx)
				.where("id", token.meta?.id ?? -1)
				.andWhereNull("unit_id")
				.update({
					unit_id: data.unitId,
				})) as unknown as number;

			if (result === 0) {
				throw new BadRequestException("Token inválido", 400, "E_INVALID_TOKEN");
			}
		});
	}
	public async login(data: ILoginData, auth: AuthContract) {
		return Database.transaction(async (trx) => {
			const system = await System.query()
				.useTransaction(trx)
				.where("name", data.system)
				.firstOrFail();

			const user = await User.query()
				.useTransaction(trx)
				.where("email", data.email)
				.where("system_id", system.id)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (!(await Hash.verify(user.password, data.password))) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			const roles = await this.getRoles(user, system.id, null, true);

			const validUnits = roles
				.map((r) => r.unit)
				.filter((u) => u !== null) as BusinessUnit[];

			const contextRole = roles.find((r) => Boolean(r.role))?.role;
			if (!contextRole) {
				throw new BadRequestException(
					"Cargo não encontrado",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (validUnits.length === 1) {
				const [unit] = validUnits;
				if (data.ip) {
					const canAccess = await this.ipService.checkAccess(
						{
							role: contextRole,
							unit: unit.id,
							user: user.id,
						},
						data.ip,
					);
					if (!canAccess) {
						throw new BadRequestException(
							"Acesso não permitido para o IP informado",
							400,
							"E_IP_NOT_ALLOWED",
						);
					}
				}

				return [
					await auth.use("api").generate(user, {
						expiresIn: "7d",
						unit_id: unit.id,
						system_id: system.id,
						system_name: system.name,
						ip: data.ip,
					}),
					system.id,
				];
			}

			const uniqueEconomicGroups = await EconomicGroup.query().whereIn(
				"id",
				validUnits.map((u) => u.economicGroupId),
			);

			const dataMap = new Map<string, BusinessUnit[]>();
			for (const eg of uniqueEconomicGroups) {
				dataMap.set(eg.id, []);
			}
			for (const u of validUnits) {
				dataMap.get(u.economicGroupId)?.push(u);
			}

			if (!data.business_unit_id) {
				const result = await Promise.all(
					Array.from(dataMap.keys()).map(async (key) => {
						const group = uniqueEconomicGroups.find((eg) => eg.id === key);

						return {
							id: group?.id,
							userType: user.type,
							fantasyName: group?.fantasyName,
							companyName: group?.companyName,
							businessUnits: await Promise.all(
								dataMap.get(key)!.map(async (bu) => ({
									id: bu.id,
									identification: bu.identification,
									status: "VALID",
								})),
							),
						};
					}),
				);

				if (result.length === 0) {
					throw new BadRequestException(
						"Credenciais inválidas",
						400,
						"E_BAD_CREDENTIALS",
					);
				}

				return result;
			}

			const unit = validUnits.find((u) => u.id === data.business_unit_id);

			if (!unit) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (data.ip) {
				const canAccess = await this.ipService.checkAccess(
					{
						role: contextRole,
						unit: unit.id,
						user: user.id,
					},
					data.ip,
				);
				if (!canAccess) {
					throw new BadRequestException(
						"Acesso não permitido para o IP informado",
						400,
						"E_IP_NOT_ALLOWED",
					);
				}
			}

			return [
				await auth.use("api").generate(user, {
					expiresIn: "7d",
					unit_id: unit.id,
					system_id: system.id,
					system_name: system.name,
					ip: data.ip,
				}),
				system.id,
			];
		});
	}

	public async getAvailableSwaps(user: User, systemID: number) {
		const roles = await this.getRoles(user, systemID, null, false);

		const validUnits = roles
			.map((r) => r.unit)
			.filter((u) => u !== null) as BusinessUnit[];

		return validUnits.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			group: elem.economicGroup.companyName,
		}));
	}

	public async controllerLogin(
		data: Omit<ILoginData, "business_unit_id">,
		auth: AuthContract,
		_?: string,
	) {
		return Database.transaction(async (trx) => {
			const system = await System.query()
				.useTransaction(trx)
				.where("name", data.system)
				.firstOrFail();

			const user = await User.query()
				.useTransaction(trx)
				.where("email", data.email)
				.where("system_id", system.id)
				.first();

			if (!user || user.type !== "controller") {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (!(await Hash.verify(user.password, data.password))) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			const $roles = await user
				.related("roles")
				.query()
				.whereHas("role", (query) => {
					query.whereIn("type", ["controller", "both"] as TRoleType[]);
				})
				.whereNull("unit_id")
				.where("active", true);
			if ($roles.length === 0) {
				throw new BadRequestException("Usuário sem cargo", 400, "E_INVALID");
			}

			return auth.use("api").generate(user, {
				expiresIn: "7d",
				system_id: system.id,
				system_name: system.name,
				ip: data.ip,
			});
		});
	}

	public async adminLogin(data: ILoginData, auth: AuthContract) {
		return Database.transaction(async (trx) => {
			const system = await System.query()
				.useTransaction(trx)
				.where("name", data.system)
				.firstOrFail();

			const user = await User.query()
				.useTransaction(trx)
				.where("email", data.email)
				.where("system_id", system.id)
				.first();

			if (
				!user ||
				!(["controller", "system"] as TUserType[]).includes(user.type)
			) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (!(await Hash.verify(user.password, data.password))) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			const roles = await user
				.related("roles")
				.query()
				.preload("role", (query) => {
					query.preload("permissions", (query) => {
						query.where("status", true);
						query.whereIn("type", [
							"controller",
							"system",
						] as TPermissionType[]);
					});
				})
				.preload("unit", (query) => {
					query.where("active", true);
				})
				.whereHas("unit", (query) => {
					query.where("active", true);
				})
				.whereHas("role", (query) => {
					query.whereIn("type", ["controller", "both"] as TRoleType[]);
				})
				.where("active", true);

			const validUnits = roles
				.map((r) => r.unit)
				.filter((u) => u !== null) as BusinessUnit[];

			const uniqueEconomicGroups = await EconomicGroup.query().whereIn(
				"id",
				validUnits.map((u) => u.economicGroupId),
			);

			const dataMap = new Map<string, BusinessUnit[]>();
			for (const eg of uniqueEconomicGroups) {
				dataMap.set(eg.id, []);
			}
			for (const u of validUnits) {
				dataMap.get(u.economicGroupId)?.push(u);
			}

			const result = await Promise.all(
				Array.from(dataMap.keys()).map(async (key) => {
					const group = uniqueEconomicGroups.find((eg) => eg.id === key);

					return {
						id: group?.id,
						fantasyName: group?.fantasyName,
						companyName: group?.companyName,
						businessUnits: await Promise.all(
							(dataMap.get(key) ?? []).map(async (bu) => ({
								id: bu.id,
								identification: bu.identification,
								status: "VALID",
							})),
						),
					};
				}),
			);

			const token = await auth.use("api").generate(user, {
				expiresIn: "7d",
				system_id: system.id,
				system_name: system.name,
				ip: null,
			});

			return {
				token,
				userID: user.id,
				userType: user.type,
				units: result,
			};
		});
	}

	public async getUser(data: ILoginData): Promise<User> {
		const user = await User.findBy("email", data.email);

		if (!user) {
			throw new BadRequestException(
				"Credenciais inválidas",
				400,
				"E_BAD_CREDENTIALS",
			);
		}

		if (!(await Hash.verify(user.password, data.password))) {
			throw new BadRequestException(
				"Credenciais inválidas",
				400,
				"E_BAD_CREDENTIALS",
			);
		}

		return user;
	}

	public async checkLicence(unit: BusinessUnit): Promise<string | null> {
		const licence = await unit
			.related("licences")
			.query()
			.where("active", true)
			.first();

		if (!licence) {
			return "E_NO_LICENCE";
		}

		if (isAfter(new Date(), licence.expirationDate)) {
			if (licence.type === LicenceType.TRIAL) {
				return "E_EXPIRED_TRIAL";
			}

			if (licence.type === LicenceType.ADDITIONAL_TRIAL) {
				return "E_EXPIRED_ADDITIONAL_TRIAL";
			}

			return "E_EXPIRED_LICENCE";
		}

		return null;
	}
}
