import { inject } from "@adonisjs/fold";
import Mail from "@ioc:Adonis/Addons/Mail";
import Encryption from "@ioc:Adonis/Core/Encryption";
import Logger from "@ioc:Adonis/Core/Logger";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import Brand from "App/Models/Brand";
import BusinessUnit from "App/Models/BusinessUnit";
import { CheckingAccountType } from "App/Models/CheckingAccount";
import ConfirmationToken from "App/Models/ConfirmationToken";
import Deposit from "App/Models/Deposit";
import EconomicGroup from "App/Models/EconomicGroup";
import { LicenceType } from "App/Models/Licence";
import {
	PaymentMethodTef,
	PaymentMethodType,
	PaymentMethodUsage,
} from "App/Models/PaymentMethod";
import Plan from "App/Models/Plan";
import Product, { ProductPurpose, ProductType } from "App/Models/Product";
import Subgroup from "App/Models/Subgroup";
import System from "App/Models/System";
import SystemPaymentMethod from "App/Models/SystemPaymentMethod";
import SystemProduct from "App/Models/SystemProduct";
import SystemTaxationGroup from "App/Models/SystemTaxationGroup";
import SystemVariationGroup from "App/Models/SystemVariationGroup";
import TaxationGroup from "App/Models/TaxationGroup";
import TaxationGroupRule, {
	CompanyType,
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import TaxOperation from "App/Models/TaxOperation";
import TefAcquirer from "App/Models/TefAcquirer";
import UfIcms from "App/Models/UfIcms";
import Unit from "App/Models/Unit";
import User, { TUserType } from "App/Models/User";
import UserPasswordChange from "App/Models/UserPasswordChange";
import VariationGroup from "App/Models/VariationGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { ICreateUser } from "Contracts/interfaces/CreateUser";
import {
	IConfirmConfirmationToken,
	ICreateConfirmationToken,
} from "Contracts/interfaces/IConfirmationToken";
import {
	IForgotPassword,
	IResetPassword,
} from "Contracts/interfaces/ResetPassword";
import { IUpdatePassword } from "Contracts/interfaces/UpdateUser";
import { SERVICE_VARIATION_GROUP_ID } from "Database/seeders/ServiceSeeder";
import { addDays } from "date-fns";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import liftOneServices from "../../database/seeders/liftone.json";
import vetechProducts from "../../database/seeders/products.json";

interface ISearch {
	name?: string;
	email?: string;
	document?: string;
	phone?: string;
}

@inject()
export default class UserService {
	constructor(private sharedService: SharedService) {}

	public async index(data: ISearch): Promise<Array<User>> {
		const qb = User.query();

		if (data.name) {
			qb.where("name", "ilike", `%${data.name}%`);
		}

		if (data.email) {
			qb.where("email", "ilike", `%${data.email}%`);
		}

		if (data.document) {
			qb.where("document", "ilike", `%${data.document}%`);
		}

		if (data.phone) {
			qb.where("phone", "ilike", `%${data.phone}%`);
		}

		return qb;
	}

	public async store(data: ICreateUser) {
		return Database.transaction(async (trx) => {
			const { systemName, ...userData } = data;

			const system = await System.query()
				.where("name", "ilike", `%${systemName}%`)
				.first();

			if (!system) {
				throw new BadRequestException(
					"Sistema não encontrado",
					400,
					"E_SYSTEM_NOT_FOUND",
				);
			}

			if (!system.default_role_id) {
				throw new InternalErrorException(
					"Erro na criação de usuário",
					400,
					"E_INTERNAL_SERVER_ERROR",
				);
			}

			const trialPlan = await Plan.findBy("default", true, {
				client: trx,
			});
			if (!trialPlan) {
				Logger.error("No trial plan");
				throw new InternalErrorException(
					"Erro na criação de usuário",
					400,
					"E_INTERNAL_SERVER_ERROR",
				);
			}

			const existingUser = await User.query()
				.useTransaction(trx)
				.whereILike("email", `%${userData.email}%`)
				.where("system_id", system.id)
				.first();
			if (existingUser) {
				throw new BadRequestException(
					"Já existe um usuário com este email",
					400,
					"E_USER_ALREADY_EXISTS",
				);
			}

			const user = await User.create(
				{ ...userData, system_id: system.id, type: "user" },
				{
					client: trx,
				},
			);

			const newGroup = await user.related("economicGroups").create(
				{
					id: v4(),
					document: data.document,
					responsibleEmail: data.email,
					responsiblePhone: data.phone,
					companyName: `Grupo ${user.name}`,
					fantasyName: `Grupo ${user.name}`,
					system_id: system.id,
					colors: system.colors,
				},
				{},
				{
					client: trx,
				},
			);

			const newBusinessUnit = await newGroup.related("businessUnits").create(
				{
					id: v4(),
					companyName: `Clínica do(a) ${user.name}`,
					document: data.document,
					phone: data.phone,
					email: data.email,
					origin: "CADASTRO SELF-SERVICE",

					address: data.address,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state?.toUpperCase(),
				},
				{
					client: trx,
				},
			);

			const tefAcquirers = await TefAcquirer.query().useTransaction(trx);
			await newBusinessUnit.related("acquirers").createMany(
				tefAcquirers.map((acq) => ({
					tef_acquirer_id: acq.id,
				})),
			);

			await user.related("roles").create(
				{
					role_id: system.default_role_id,
					unit_id: newBusinessUnit.id,
				},
				{
					client: trx,
				},
			);

			await newBusinessUnit.related("licences").create(
				{
					id: v4(),
					expirationDate: addDays(new Date(), 1000),
					type: LicenceType.TRIAL,
					active: true,
				},
				{
					client: trx,
				},
			);

			const deposit = await Deposit.create(
				{
					economic_group_id: newGroup.id,
					business_unit_id: newBusinessUnit.id,
					description: "Deposito Central / Almoxarifado",
					type: "Venda",
					status: "Ativo",
					principal: true,
				},
				{ client: trx },
			);

			await newBusinessUnit.related("unitConfig").create({
				service_variation_group_id: SERVICE_VARIATION_GROUP_ID,
				incoming_deposit_id: deposit.id,
				outgoing_deposit_id: deposit.id,
				config: system.defaultConfig,
			});

			const systemPaymentMethods = await SystemPaymentMethod.query()
				.useTransaction(trx)
				.where("system_id", system.id);

			await newGroup.related("paymentMethods").createMany(
				systemPaymentMethods.map((p) => ({
					description: p.description,
					requiresDocument: p.requiresDocument,
					tef: p.tef,
					type: p.type,
					fee: p.fee,
					usage: p.usage,
					nfe_code: p.nfe_code,
					automaticCancellation: p.automaticCancellation,
					daysFirstInstallment: p.daysFirstInstallment,
					daysBetweenInstallments: p.daysBetweenInstallments,
					daysUntilTransfer: p.daysUntilTransfer,
					maxInstallments: p.maxInstallments,
					installmentsWithoutPassword: p.installmentsWithoutPassword,
					minimumInstallmentValue: p.minimumInstallmentValue,
				})),
				{
					client: trx,
				},
			);

			await newBusinessUnit.related("checkingAccounts").create(
				{
					economic_group_id: newGroup.id,
					description: "Cofre - Matriz",
					accountNumber: "Cofre",
					bankCode: "Cofre",
					bankName: "Cofre",
					agency: "001",
					type: CheckingAccountType.CX,
					balance: 0,
					active: true,
				},
				{
					client: trx,
				},
			);

			const systemTaxationGroups = await SystemTaxationGroup.query()
				.useTransaction(trx)
				.where("system_id", system.id)
				.preload("rules", (query) => {
					query
						.whereILike("from_uf", `%${data.state ?? "SKIP"}%`)
						.whereILike("to_uf", `%${data.state ?? "SKIP"}%`);
				});
			const taxationGroups = await newGroup
				.related("taxationGroups")
				.createMany(
					systemTaxationGroups.map<Partial<TaxationGroup>>((t) => ({
						name: t.name,
						active: t.active,
					})),
					{
						client: trx,
					},
				);

			const taxOperations = await TaxOperation.query()
				.useTransaction(trx)
				.whereNull("economic_group_id");

			const tasks = taxationGroups.map(async (group, idx) => {
				const rules = systemTaxationGroups[idx].rules;

				return await group.related("rules").createMany(
					rules.map<Partial<TaxationGroupRule>>((r) => {
						const operation = taxOperations.find(
							(t) =>
								t.code === r.taxOperationCode &&
								t.movementType === r.movementType &&
								t.movementCategory === r.movementCategory &&
								t.active,
						);

						return {
							tax_operation_id: operation?.id,

							active: r.active,
							ivaIcmsSt: r.ivaIcmsSt,
							icmsPercRedBaseCalculoST: r.icmsPercRedBaseCalculoST,
							icmsPercDiferimento: r.icmsPercDiferimento,
							icmsPercRedAliquota: r.icmsPercRedAliquota,
							icmsPercRedBaseCalculo: r.icmsPercRedBaseCalculo,
							taxBenefitCode: r.taxBenefitCode,
							companyType: r.companyType,
							movementType: r.movementType,
							movementCategory: r.movementCategory,
							fromUf: r.fromUf,
							toUf: r.toUf,
							icmsCst: r.icmsCst,
							icmsPerc: r.icmsPerc,
							fcpPerc: r.fcpPerc,
							pisCst: r.pisCst,
							pisPerc: r.pisPerc,
							cofinsCst: r.cofinsCst,
							cofinsPerc: r.cofinsPerc,
							ipiCst: r.ipiCst,
							ipiPerc: r.ipiPerc,
						};
					}),
					{
						client: trx,
					},
				);
			});
			await Promise.all(tasks);

			const systemVariationGroups = await SystemVariationGroup.query()
				.useTransaction(trx)
				.preload("variations")
				.where("system_id", system.id);

			const variationGroups = await newGroup
				.related("variationGroups")
				.createMany(
					systemVariationGroups.map((v) => ({
						description: v.description,
						active: v.active,
					})),
					{
						client: trx,
					},
				);
			const variationTasks = variationGroups.map(async (vg) => {
				return vg
					.related("variations")
					.attach(
						systemVariationGroups
							.find((f) => f.description === vg.description)
							?.variations.map((v) => v.id) ?? [],
					);
			});
			await Promise.all(variationTasks);

			const systemProducts = await SystemProduct.query()
				.useTransaction(trx)
				.where("system_id", system.id)
				.preload("variations");

			const products = await newGroup.related("products").createMany(
				systemProducts.map((p) => {
					const systemTaxationGroup = systemTaxationGroups.find(
						(t) => t.id === p.system_taxation_group_id,
					);
					const systemVariationGroup = systemVariationGroups.find(
						(v) => v.id === p.system_variation_group_id,
					);

					const realTaxationGroup = taxationGroups.find(
						(t) => t.name === systemTaxationGroup?.name,
					);
					const realVariationGroup = variationGroups.find(
						(v) => v.description === systemVariationGroup?.description,
					);

					return {
						subgroup_id: p.subgroup_id,
						brand_id: p.brand_id,
						unit_id: p.unit_id,
						taxation_group_id: realTaxationGroup?.id,
						variation_group_id: realVariationGroup?.id,
						group_id: p.group_id,
						system_product_id: p.id,

						// fractioned: p.fr,
						serviceCode: p.serviceCode,
						serviceType: p.serviceType,
						collectionYear: p.collectionYear,
						taxBenefitCode: p.taxBenefitCode,
						features: p.features,
						description: p.description,
						type: p.type,
						referenceCode: p.referenceCode,
						ncm: p.ncm,
						cest: p.cest,
						icmsOrigin: p.icmsOrigin,
						anvisaCode: p.anvisaCode,
						active: p.active,
						purpose: p.purpose,
					};
				}),
				{
					client: trx,
				},
			);

			const tasks2 = products.map(async (p, idx) => {
				const variations = systemProducts[idx].variations;
				return await p.related("variations").createMany(
					variations.map((v) => ({
						barcode: v.barcode,
					})),
					{
						client: trx,
					},
				);
			});
			await Promise.all(tasks2);

			// MARKET

			return { user, unit: newBusinessUnit, system };
		});
	}

	public async createUserController(
		systemID: number,
		data: {
			name: string;
			email: string;
			document: string;
			password: string;

			roleId: number;
			units: string[];

			phone?: string;
			postalCode?: string;
			address?: string;
			number?: string;
			complement?: string;
			district?: string;
			city?: string;
			state?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const user = await User.create(
				{
					name: data.name,
					email: data.email,
					document: data.document,
					password: data.password,
					system_id: systemID,
					type: "controller",

					phone: data.phone,
					postalCode: data.postalCode,
					address: data.address,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state,
				},
				{
					client: trx,
				},
			);

			await user.related("roles").create(
				{
					role_id: data.roleId,
				},
				{
					client: trx,
				},
			);

			await user.related("roles").createMany(
				data.units.map((u) => ({
					role_id: data.roleId,
					unit_id: u,
				})),
				{
					client: trx,
				},
			);

			const units = await BusinessUnit.query()
				.useTransaction(trx)
				.whereIn("id", data.units);

			const uniqueEconomicGroups = units.reduce((acc, curr) => {
				if (!acc.find((a) => a === curr.economicGroupId)) {
					acc.push(curr.economicGroupId);
				}
				return acc;
			}, [] as string[]);

			await user.related("economicGroups").attach(uniqueEconomicGroups, trx);
		});
	}

	public async updateUserController(
		systemID: number,
		data: {
			id: string;
			name: string;
			email: string;
			document: string;

			roleId: number;
			units: string[];

			phone?: string;
			postalCode?: string;
			address?: string;
			number?: string;
			complement?: string;
			district?: string;
			city?: string;
			state?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const user = await User.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("system_id", systemID)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Usuário não encontrado",
					400,
					"E_USER_NOT_FOUND",
				);
			}

			if (user.type !== "controller") {
				throw new BadRequestException(
					"Usuário não é um controlador",
					400,
					"E_INVALID_USER_TYPE",
				);
			}

			await user
				.merge({
					name: data.name,
					email: data.email,
					document: data.document,
					// password: data.password,

					phone: data.phone,
					postalCode: data.postalCode,
					address: data.address,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state,
				})
				.useTransaction(trx)
				.save();

			await user.related("roles").query().useTransaction(trx).delete();

			await user.related("roles").create(
				{
					role_id: data.roleId,
				},
				{
					client: trx,
				},
			);

			await user.related("roles").createMany(
				data.units.map((u) => ({
					role_id: data.roleId,
					unit_id: u,
				})),
				{
					client: trx,
				},
			);

			const units = await BusinessUnit.query()
				.useTransaction(trx)
				.whereIn("id", data.units);

			const uniqueEconomicGroups = units.reduce((acc, curr) => {
				if (!acc.find((a) => a === curr.economicGroupId)) {
					acc.push(curr.economicGroupId);
				}
				return acc;
			}, [] as string[]);

			await user
				.related("economicGroups")
				.sync(uniqueEconomicGroups, true, trx);
		});
	}

	public async fetchUserControllers(systemID: number) {
		const result = await User.query()
			.where("system_id", systemID)
			.where("type", "controller" as TUserType)
			.select("id", "name", "email", "document", "password")
			.preload("roles", (query) => {
				query.select("role_id", "unit_id");
				query.where("active", true);

				query.preload("unit", (query) => {
					query.preload("economicGroup");
				});
			});

		return result.map((elem) => ({
			id: elem.id,
			name: elem.name,
			email: elem.email,
			document: elem.document,
			roleId: elem.roles.find((r) => r.role_id)?.role_id ?? null,
			units: elem.roles
				.filter((r) => !!r.unit)
				.map((r) => {
					return {
						id: r.unit.id,
						identification: r.unit.identification ?? null,
						economicGroup: {
							id: r.unit.economicGroup.id,
							fantasy_name: r.unit.economicGroup.fantasyName ?? null,
							company_name: r.unit.economicGroup.companyName ?? null,
						},
					};
				}),
		}));
	}

	public async softDeleteUserController(
		systemID: number,
		data: {
			id: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const user = await User.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("system_id", systemID)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Usuário não encontrado",
					400,
					"E_USER_NOT_FOUND",
				);
			}

			// if (user.type !== "controller") {
			// 	throw new BadRequestException(
			// 		"Usuário não é um controlador",
			// 		400,
			// 		"E_INVALID_USER_TYPE",
			// 	);
			// }

			await user.softDelete();
		});
	}

	public async disableUserControllerRole(
		authCtx: AuthContext,
		data: {
			id: string;
			roleId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const user = await User.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("system_id", authCtx.system.id)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Usuário não encontrado",
					400,
					"E_USER_NOT_FOUND",
				);
			}

			if (user.type !== "controller") {
				throw new BadRequestException(
					"Usuário não é um controlador",
					400,
					"E_INVALID_USER_TYPE",
				);
			}

			await user
				.related("roles")
				.query()
				.useTransaction(trx)
				.where("role_id", data.roleId)
				.update({ active: false });
		});
	}

	public async show(id: string): Promise<User> {
		const user = await User.find(id);

		if (!user) {
			throw new ResourceNotFoundException(
				"The user was not found",
				404,
				"E_NOT_FOUND",
			);
		}

		return user;
	}

	public async checkExistingEmail(email: string) {
		const user = await User.findBy("email", email);
		if (!user) {
			return {
				exists: false,
				has_token: false,
			};
		}
		const token = await ConfirmationToken.query()
			.where("email", email)
			.where("expires_at", ">", new Date())
			.where("active", true)
			.first();

		return {
			exists: true,
			has_token: Boolean(token),
		};
	}

	public async checkExistingDocument(document: string) {
		const isValidDocument = this.sharedService.validDocument(document);
		if (!isValidDocument) {
			return {
				valid: false,
				exists: false,
			};
		}

		const user = await User.findBy("document", document);

		return {
			valid: true,
			exists: Boolean(user),
		};
	}

	public async resendConfirmationToken(email: string) {
		const user = await User.findBy("email", email);
		if (user) {
			throw new BadRequestException("Email cadastrado", 400, "E_USER_EXISTS");
		}

		const token = await ConfirmationToken.query()
			.where("email", email)
			.where("expires_at", ">", new Date())
			.where("active", true)
			.first();

		if (!token) {
			throw new BadRequestException(
				"Sem token válido",
				400,
				"E_NO_VALID_TOKEN",
			);
		}

		await Mail.send((message) => {
			message
				.from("sysvetech@gmail.com")
				.to(token.email)
				.subject("Confirmação de email")
				.htmlView("emails/confirmation_code", {
					name: token.name,
					code: token.code,
				});
		});
	}

	public async createConfirmationToken(
		data: ICreateConfirmationToken,
	): Promise<number> {
		const code = Math.ceil(Math.random() * 10000)
			.toString()
			.padStart(6, "0");

		const existing = await ConfirmationToken.findBy("code", code);
		if (!existing) {
			await ConfirmationToken.create({
				name: data.name,
				phone: data.phone,
				code,
				email: data.email,
				expiresAt: DateTime.now().plus({ hour: 1 }),
			});
			await Mail.send((message) => {
				message
					.from("sysvetech@gmail.com")
					.to(data.email)
					.subject("Confirmação de email")
					.htmlView("emails/confirmation_code", {
						name: data.name,
						code,
					});
			});

			return 1;
		}

		return this.createConfirmationToken(data);
	}

	public async confirmConfirmationToken(
		data: IConfirmConfirmationToken,
	): Promise<void> {
		const token = await ConfirmationToken.query()
			.where("code", data.code)
			.andWhere("email", data.email)
			.first();

		if (!token) {
			throw new BadRequestException("Token não encontrado", 400, "E_NO_TOKEN");
		}

		if (!token.active || token.expiresAt.diffNow("seconds").seconds < 0) {
			throw new BadRequestException("Token expirado", 400, "E_EXPIRED_TOKEN");
		}

		token
			.merge({
				active: false,
				confirmedAt: DateTime.now(),
			})
			.save();
	}

	public async update(user: User, data: IUpdatePassword): Promise<User> {
		return user.merge(data).save();
	}

	public async delete(user: User): Promise<void> {
		await user.softDelete();
	}

	public async sendChangePasswordEmail(authCtx: AuthContext) {
		const validEmailChange = await UserPasswordChange.query()
			.where("system_id", authCtx.system.id)
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("user_id", authCtx.user.id)
			.where("expires_at", ">", DateTime.now().toJSDate())
			.where("completed", false)
			.first();

		if (validEmailChange) {
			throw new BadRequestException(
				"Já existe uma solicitação de alteração de senha para este usuário",
				400,
				"E_ALREADY_REQUESTED",
			);
		}

		const hash = Encryption.encrypt(authCtx.user.email, "1h");

		await UserPasswordChange.create({
			system_id: authCtx.system.id,
			economic_group_id: authCtx.group.id,
			business_unit_id: authCtx.unit.id,
			user_id: authCtx.user.id,
			hash,
			expiresAt: DateTime.now().plus({ hour: 1 }),
			type: "change",
		});

		await Mail.send((message) => {
			message
				.from("sysvetech@gmail.com")
				.to(authCtx.user.email)
				.subject("Troca de Senha")
				.htmlView("emails/change_password", {
					email: authCtx.user.email,
					url: `${
						authCtx.system.systemUrls.find((r) => r.url)?.url
					}/senha/change/${hash}`,
				});
		});
	}

	public async handleChangePasswordEmail(
		authCtx: AuthContext,
		data: { hash: string; password: string },
	) {
		await Database.transaction(async (trx) => {
			const validEmailChange = await UserPasswordChange.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("user_id", authCtx.user.id)
				.where("hash", data.hash)
				.first();

			if (!validEmailChange) {
				throw new BadRequestException(
					"Não existe uma solicitação de alteração de senha para este usuário",
					400,
					"E_ALREADY_REQUESTED",
				);
			}

			if (validEmailChange.expiresAt.diffNow("seconds").seconds < 0) {
				throw new BadRequestException(
					"O link de alteração de senha expirou",
					400,
					"E_EXPIRED_LINK",
				);
			}

			if (validEmailChange.completed) {
				throw new BadRequestException(
					"O link de alteração de senha já foi utilizado",
					400,
					"E_COMPLETED_LINK",
				);
			}

			await validEmailChange
				.merge({
					completed: true,
				})
				.useTransaction(trx)
				.save();

			await authCtx.user
				.merge({
					password: data.password,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async forgotPassword({
		email,
		systemName,
	}: IForgotPassword): Promise<void> {
		const user = await User.query()
			.where("email", email)
			.whereHas("system", (query) => {
				query.where("name", systemName);
			})
			.preload("system", (query) => {
				query.preload("systemUrls");
			})
			.first();

		if (!user) {
			throw new BadRequestException(
				"Usuário não encontrado",
				400,
				"E_USER_NOT_FOUND",
			);
		}

		const hash = Encryption.encrypt(email, "30min");

		await UserPasswordChange.create({
			system_id: user.system_id,
			user_id: user.id,
			hash,
			expiresAt: DateTime.now().plus({ hour: 1 }),
			type: "forgot",
		});

		await Mail.send((message) => {
			message
				.from("sysvetech@gmail.com")
				.to(email)
				.subject("Recuperação de Senha")
				.htmlView("emails/reset_password", {
					email,
					url: `${
						user.system.systemUrls.find((r) => r.url)?.url
					}/senha/reset/${hash}`,
				});
		});
	}

	public async resetPassword({
		hash,
		password,
	}: IResetPassword): Promise<void> {
		await Database.transaction(async (trx) => {
			const validEmailChange = await UserPasswordChange.query()
				.useTransaction(trx)
				.preload("user")
				.where("hash", hash)
				.first();

			if (!validEmailChange) {
				throw new BadRequestException("Token inválido", 400, "E_INVALID_TOKEN");
			}

			if (validEmailChange.expiresAt.diffNow("seconds").seconds < 0) {
				throw new BadRequestException(
					"O link de alteração de senha expirou",
					400,
					"E_EXPIRED_LINK",
				);
			}

			if (validEmailChange.completed) {
				throw new BadRequestException(
					"O link de alteração de senha já foi utilizado",
					400,
					"E_COMPLETED_LINK",
				);
			}

			const decryptedEmail = Encryption.decrypt(hash);

			if (decryptedEmail !== validEmailChange.user.email) {
				throw new UnauthorizedException(
					"Token inválido",
					400,
					"E_UNAUTHORIZED",
				);
			}

			await validEmailChange.user
				.merge({
					password,
				})
				.useTransaction(trx)
				.save();

			await validEmailChange
				.merge({
					completed: true,
				})
				.useTransaction(trx)
				.save();
		});
	}

	private async seedLiftOneData(
		group: EconomicGroup,
		bunit: BusinessUnit,
		trx: TransactionClientContract,
	) {
		const parseString = (value: string) => {
			return value.replace(",", "").replaceAll(".", ",");
		};

		const parseNumber = (value: string) => {
			return parseFloat(parseString(value));
		};

		const units = await Unit.query()
			.useTransaction(trx)
			.whereNull("economic_group_id");

		const ufIcms = await UfIcms.query()
			.useTransaction(trx)
			.where("origin_uf", bunit.state ? bunit.state.toUpperCase() : "-1")
			.andWhere(
				"destination_uf",
				bunit.state ? bunit.state.toUpperCase() : "-1",
			)
			.where("active", true)
			.first();

		// VERIFICAR PLANILHA
		const [firstTaxGroup, secondTaxGroup] = await group
			.related("taxationGroups")
			.createMany(
				[
					{
						name: "Dermocosméticos",
					},
					{
						name: "Serviços",
					},
				],
				{
					client: trx,
				},
			);
		const taxOperation = await TaxOperation.query()
			.useTransaction(trx)
			.where("code", "5.102")
			.where("movement_category", MovementCategory.NS)
			.where("movement_type", MovementType.S)
			.firstOrFail();

		await firstTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		await secondTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		const variationGroup = await VariationGroup.create(
			{
				economic_group_id: group?.id,
				description: "Padrão",
				active: true,
			},
			{
				client: trx,
			},
		);

		const rawSubgroups = liftOneServices.map((elem) => elem.subgroups);
		const existingSubgroups = await Subgroup.query()
			.useTransaction(trx)
			.whereNull("economic_group_id")
			.whereIn("description", rawSubgroups)
			.where("system_id", group.system_id);
		const toCreate = await Promise.all(
			rawSubgroups
				.filter((s) => !existingSubgroups.find((es) => es.description === s))
				.map(async (s) => {
					return Subgroup.create(
						{
							description: s,
							system_id: group.system_id,
						},
						{ client: trx },
					);
				}),
		);
		const subgroups = existingSubgroups.concat(toCreate);

		const pData: Array<Partial<Product>> = liftOneServices.map((elem) => {
			const unit = units.find((u) => u.tag === elem.Unidade.toLowerCase());
			const subgroup = subgroups.find((u) => u.description === elem.subgroups);
			const taxGroup = [firstTaxGroup, secondTaxGroup].find(
				(u) => u.name.toLowerCase() === elem["Grupo Tributacao"].toLowerCase(),
			);

			if (!unit) {
				throw new Error(
					`Unidade ${elem.Unidade} não encontrada para o produto ${elem.Produto}`,
				);
			}
			// if (!brand) {
			//   throw new Error(
			//     `Marca ${elem.brands} não encontrada para o produto ${elem.Produto}`,
			//   );
			// }
			if (!subgroup) {
				throw new Error(
					`Subgrupo ${elem.subgroups} não encontrada para o produto ${elem.Produto}`,
				);
			}

			return {
				description: elem.Produto,
				type: ProductType.SERVICE,
				referenceCode: elem.Código.toString(),
				ncm: undefined,
				cest: undefined,
				unit_id: unit.id,
				icmsOrigin: "0", // TODO correct
				economic_group_id: group.id,
				subgroup_id: subgroup.id,
				brand_id: undefined,
				anvisaCode: undefined,
				taxation_group_id: taxGroup?.id,
				variation_group_id: variationGroup.id,
				purpose: ProductPurpose.BOTH,
			};
		});

		const products = await Product.createMany(pData, { client: trx });
		const variationsPromises = products.map((product) => {
			const rawProduct = liftOneServices.find(
				(p) => p["Código"].toString() === product.referenceCode,
			);

			if (!rawProduct) {
				throw new Error(
					`Produto ${product.referenceCode} não encontrou para o raw product`,
				);
			}

			return product.related("variations").create(
				{
					barcode: undefined,
				},
				{
					client: trx,
				},
			);
		});
		const variations = await Promise.all(variationsPromises);

		const unitProducts = products.map((product) => {
			const rawProduct = liftOneServices.find(
				(p) => p["Código"].toString() === product.referenceCode,
			);

			if (!rawProduct) {
				throw new Error(
					`Produto ${product.referenceCode} não encontrou para o raw product`,
				);
			}

			const variation = variations.find((v) => v.product_id === product.id);
			if (!variation) {
				throw new Error(
					`Variação não encontrada para produto ${product.referenceCode}`,
				);
			}

			return variation.related("businessUnitProducts").create(
				{
					businness_unit_id: bunit.id,
					stock: 0,
					maximumStock: rawProduct["Máximo"] ?? 0,
					minimumStock: rawProduct?.Minimo ?? 0,
					maximumDiscountPercentage: 0,
					maximumDiscountValue: 0,
					price: rawProduct.Venda ? parseNumber(rawProduct.Venda) : 0,
					costPrice: rawProduct.Custo ? parseNumber(rawProduct.Custo) : 0,
					profitMargin: 0,
					commission: 0,
					meta: 0,
					metaType: undefined,
					commissionMeta: 0,
				},
				{
					client: trx,
				},
			);
		});
		await Promise.all(unitProducts);
	}

	private async seedData(
		group: EconomicGroup,
		bunit: BusinessUnit,
		trx: TransactionClientContract,
	) {
		const parseString = (value: string) => {
			return value.replace(",", ".").replaceAll(".", "");
		};

		const parseNumber = (value: string) => {
			return parseFloat(parseString(value)) / 100;
		};

		const parsePurpose = (value: string) => {
			switch (value) {
				case "Consumo Interno": {
					return ProductPurpose.INTERNAL;
				}
				case "Venda": {
					return ProductPurpose.SALE;
				}
				case "Apenas venda": {
					return ProductPurpose.SALE;
				}
				case "Venda e Consumo Interno": {
					return ProductPurpose.BOTH;
				}
				default: {
					throw new Error(`Invalid purpose: ${value}`);
				}
			}
		};

		const brands = await Brand.query()
			.useTransaction(trx)
			.where("system_id", group.system_id)
			.whereNull("economic_group_id");

		await group.related("paymentMethods").createMany(
			[
				{
					description: "Boleto",
					requiresDocument: false,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.AMBOS,
					nfe_code: "15",
					automaticCancellation: false,
					daysFirstInstallment: 30,
					daysBetweenInstallments: 30,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "PIX",
					requiresDocument: false,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.AMBOS,
					nfe_code: "17",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Transferência",
					requiresDocument: false,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.AMBOS,
					nfe_code: "18",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Cheque",
					requiresDocument: false,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.PAGAR,
					nfe_code: "02",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Dinheiro",
					requiresDocument: false,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.AMBOS,
					nfe_code: "01",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Débito em Conta",
					requiresDocument: false,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.PAGAR,
					nfe_code: "99",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Crédito devolução",
					requiresDocument: true,
					tef: PaymentMethodTef.N,
					fee: 0,
					usage: PaymentMethodUsage.RECEBER,
					nfe_code: "05",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Cartão de Débito (POS)",
					requiresDocument: true,
					tef: PaymentMethodTef.P,
					type: PaymentMethodType.D,
					fee: 0,
					usage: PaymentMethodUsage.AMBOS,
					nfe_code: "04",
					automaticCancellation: false,
					daysFirstInstallment: 0,
					daysBetweenInstallments: 0,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
				{
					description: "Cartão de Crédito (POS)",
					requiresDocument: true,
					tef: PaymentMethodTef.P,
					type: PaymentMethodType.C,
					fee: 0,
					usage: PaymentMethodUsage.AMBOS,
					nfe_code: "03",
					automaticCancellation: false,
					daysFirstInstallment: 30,
					daysBetweenInstallments: 30,
					daysUntilTransfer: 0,
					maxInstallments: 1,
					installmentsWithoutPassword: 1,
					minimumInstallmentValue: 0,
				},
			],
			{ client: trx },
		);

		await bunit.related("checkingAccounts").create(
			{
				economic_group_id: group.id,
				description: `Cofre - Matriz`,
				accountNumber: "Cofre",
				bankCode: "Cofre",
				bankName: "Cofre",
				agency: "001",
				type: CheckingAccountType.CX,
				balance: 0,
				active: true,
			},
			{
				client: trx,
			},
		);

		const ufIcms = await UfIcms.query()
			.useTransaction(trx)
			.where("origin_uf", bunit.state ? bunit.state.toUpperCase() : "-1")
			.andWhere(
				"destination_uf",
				bunit.state ? bunit.state.toUpperCase() : "-1",
			)
			.where("active", true)
			.first();
		const [
			firstTaxGroup,
			secondTaxGroup,
			thirdTaxGroup,
			fourthTaxGroup,
			fifthTaxGroup,
		] = await group.related("taxationGroups").createMany(
			[
				{
					name: "Acessorios",
				},
				{
					name: "Instrumentos para Transfusao",
				},
				{
					name: "Medicamentos Veterinarios",
				},
				{
					name: "Vacinas",
				},
				{
					name: "Serviços",
				},
			],
			{
				client: trx,
			},
		);
		const taxOperation = await TaxOperation.query()
			.useTransaction(trx)
			.where("code", "5.102")
			.where("movement_category", MovementCategory.NS)
			.where("movement_type", MovementType.S)
			.firstOrFail();
		await firstTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		await secondTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		await thirdTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		await fourthTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: ufIcms?.icmsPercentage,
					fcpPerc: ufIcms?.fcpIcms,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		await fifthTaxGroup.related("rules").createMany(
			[
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.S,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "102",
					icmsPerc: 0,
					fcpPerc: 0,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
				{
					tax_operation_id: taxOperation?.id,
					companyType: CompanyType.N,
					movementType: MovementType.S,
					movementCategory: MovementCategory.NS,
					fromUf: bunit.state,
					toUf: bunit.state,
					icmsCst: "00",
					icmsPerc: 0,
					fcpPerc: 0,
					pisCst: "49",
					pisPerc: 0,
					cofinsCst: "49",
					cofinsPerc: 0,
					ipiCst: "99",
					ipiPerc: 0,
				},
			],
			{
				client: trx,
			},
		);

		const variationGroup = await VariationGroup.create(
			{
				economic_group_id: group?.id,
				description: "Padrão",
				active: true,
			},
			{
				client: trx,
			},
		);

		const rawUnits = vetechProducts.map((elem) => elem.Unidade);
		const units = await Unit.fetchOrCreateMany(
			["name", "system_id"],
			rawUnits.map((elem) => ({
				name: elem,
				tag: elem.toLowerCase(),
				system_id: group.system_id,
			})),
			{ client: trx },
		);

		const rawSubgroups = vetechProducts.map((elem) => elem.subgroups);
		const existingSubgroups = await Subgroup.query()
			.useTransaction(trx)
			.whereNull("economic_group_id")
			.whereIn("description", rawSubgroups)
			.where("system_id", group.system_id);
		const toCreate = await Promise.all(
			rawSubgroups
				.filter((s) => !existingSubgroups.find((es) => es.description === s))
				.map(async (s) => {
					return Subgroup.create(
						{
							description: s,
							system_id: group.system_id,
						},
						{ client: trx },
					);
				}),
		);
		const subgroups = existingSubgroups.concat(toCreate);

		const pData: Array<Partial<Product>> = vetechProducts.map((elem) => {
			const unit = units.find((u) => u.tag === elem.Unidade.toLowerCase());
			const brand = brands.find(
				(u) => u.description.toLowerCase() === elem.brands?.toLowerCase(),
			);
			const subgroup = subgroups.find((u) => u.description === elem.subgroups);

			const taxGroup = [
				firstTaxGroup,
				secondTaxGroup,
				thirdTaxGroup,
				fourthTaxGroup,
				fifthTaxGroup,
			].find(
				(u) => u.name.toLowerCase() === elem["Grupo Tributacao"].toLowerCase(),
			);

			if (!unit) {
				throw new Error(
					`Unidade ${elem.Unidade} não encontrada para o produto ${elem.Produto}`,
				);
			}
			// if (!brand) {
			//   throw new Error(
			//     `Marca ${elem.brands} não encontrada para o produto ${elem.Produto}`,
			//   );
			// }
			if (!subgroup) {
				throw new Error(
					`Subgrupo ${elem.subgroups} não encontrada para o produto ${elem.Produto}`,
				);
			}

			return {
				description: elem.Produto,
				type:
					elem.Tipo === "Produto" ? ProductType.PRODUCT : ProductType.SERVICE,
				referenceCode: elem.Código.toString(),
				ncm: elem["Código NCM"] ? elem["Código NCM"].toString() : undefined,
				cest: elem?.CEST?.toString() ?? undefined,
				unit_id: unit.id,
				icmsOrigin: "0", // TODO correct
				economic_group_id: group.id,
				subgroup_id: subgroup.id,
				brand_id: brand?.id,
				anvisaCode: elem["Código ANVISA"]?.toString() ?? undefined,
				taxation_group_id: taxGroup?.id,
				variation_group_id: variationGroup.id,
				purpose:
					elem.Tipo === "Produto"
						? parsePurpose(elem["Propósito"])
						: ProductPurpose.BOTH,
			};
		});

		const products = await Product.createMany(pData, { client: trx });
		const variationsPromises = products.map((product) => {
			const rawProduct = vetechProducts.find(
				(p) => p["Código"].toString() === product.referenceCode,
			);

			if (!rawProduct) {
				throw new Error(
					`Produto ${product.referenceCode} não encontrou para o raw product`,
				);
			}

			return product.related("variations").create(
				{
					barcode: rawProduct["Código Barra"]?.toString() ?? undefined,
				},
				{
					client: trx,
				},
			);
		});
		const variations = await Promise.all(variationsPromises);

		const unitProducts = products.map((product) => {
			const rawProduct = vetechProducts.find(
				(p) => p["Código"].toString() === product.referenceCode,
			);

			if (!rawProduct) {
				throw new Error(
					`Produto ${product.referenceCode} não encontrou para o raw product`,
				);
			}

			const variation = variations.find((v) => v.product_id === product.id);
			if (!variation) {
				throw new Error(
					`Variação não encontrada para produto ${product.referenceCode}`,
				);
			}

			return variation.related("businessUnitProducts").create(
				{
					businness_unit_id: bunit.id,
					stock: 0,
					maximumStock: rawProduct["Máximo"] ?? 0,
					minimumStock: rawProduct?.Minimo ?? 0,
					maximumDiscountPercentage: 0,
					maximumDiscountValue: 0,
					price: rawProduct.Venda ? parseNumber(rawProduct.Venda) : undefined,
					costPrice: rawProduct.Custo
						? parseNumber(rawProduct.Custo)
						: undefined,
					profitMargin: 0,
					commission: 0,
					meta: 0,
					metaType: undefined,
					commissionMeta: 0,
				},
				{
					client: trx,
				},
			);
		});
		await Promise.all(unitProducts);
	}
}
