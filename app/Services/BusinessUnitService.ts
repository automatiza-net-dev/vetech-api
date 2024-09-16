import { inject } from "@adonisjs/fold";
import Logger from "@ioc:Adonis/Core/Logger";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import BusinessUnit from "App/Models/BusinessUnit";
import CheckingAccount, {
	CheckingAccountType,
} from "App/Models/CheckingAccount";
import { LicenceType } from "App/Models/Licence";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { validCNPJ } from "App/Shared";
import { IBusinessUnitAcquirerData } from "Contracts/interfaces/IBusinessUnitAcquirerData";
import { ICreateBusinessUnit } from "Contracts/interfaces/ICreateBusinessUnit";
import { IUpdateUnitUser } from "Contracts/interfaces/IUpdateUnitUser";
import { IUpdateBusinessUnit } from "Contracts/interfaces/UpdateBusinessUnit";
import { addDays } from "date-fns";
import { v4 } from "uuid";

interface ISearchBusinessUnit {
	identification?: string;
	email?: string;
}

interface ISearchClinic {
	identification?: string;
	document?: string;
	name?: string;
}

@inject()
export default class BusinessUnitService {
	constructor(private readonly sharedService: SharedService) {}

	public async systemUnits(authCtx: AuthContext): Promise<Array<BusinessUnit>> {
		return BusinessUnit.query()
			.where("active", true)
			.whereNull("deleted_at")
			.select("id", "identification", "economic_group_id")
			.preload("economicGroup", (query) => {
				query.select("id", "companyName");
			})
			.whereHas("economicGroup", (query) => {
				query.where("system_id", authCtx.system.id);
			});
	}

	public async index(data: ISearchBusinessUnit): Promise<Array<BusinessUnit>> {
		const qb = BusinessUnit.query().preload("economicGroup");

		if (data.identification) {
			qb.where("identification", "ilike", `%${data.identification}%`);
		}

		if (data.email) {
			qb.where("email", "ilike", `%${data.email}%`);
		}

		return qb;
	}

	public async store(user: User, data: ICreateBusinessUnit) {
		try {
			await Database.transaction(async (trx) => {
				const economicGroups = await user
					.related("economicGroups")
					.query()
					.useTransaction(trx);
				const economicGroup = economicGroups.find(
					(eg) => eg.id === data.economic_group_id,
				);

				if (!economicGroup) {
					throw new BadRequestException("Grupo econômico inválido");
				}

				if (!validCNPJ(data.document)) {
					throw new BadRequestException(
						"Documento inválido",
						400,
						"E_INVALID_DOCUMENT",
					);
				}
				const hasUnitWithDocument = await economicGroup
					.related("businessUnits")
					.query()
					.useTransaction(trx)
					.where("document", data.document)
					.first();
				if (hasUnitWithDocument) {
					throw new BadRequestException(
						`Este Cnpj já existe neste Grupo Economico para a Clinica "${
							data.fantasyName ?? "-"
						}";`,
						400,
						"E_INVALID_DOCUMENT",
					);
				}

				const products = await economicGroup
					.related("products")
					.query()
					.useTransaction(trx)
					.preload("variations", (query) => {
						query.preload("businessUnitProducts");
					});

				const unit = await economicGroup.related("businessUnits").create(
					{
						...data,
					},
					{
						client: trx,
					},
				);

				await unit.related("unitConfig").create({});

				await unit.related("licences").create(
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

				// eslint-disable-next-line no-restricted-syntax
				for await (const product of products) {
					// eslint-disable-next-line no-restricted-syntax
					for await (const variation of product.variations) {
						const [unitPrice] = product.variations[0].businessUnitProducts;

						await variation.related("businessUnitProducts").create(
							{
								businness_unit_id: unit.id,
								stock: 0,
								price: unitPrice.price,
								costPrice: unitPrice.costPrice,
								maximumStock: unitPrice.maximumStock,
								minimumStock: unitPrice.minimumStock,
								maximumDiscountPercentage: unitPrice.maximumDiscountPercentage,
								maximumDiscountValue: unitPrice.maximumDiscountValue,
								profitMargin: unitPrice.profitMargin,
							},
							{
								client: trx,
							},
						);
					}
				}

				await CheckingAccount.create(
					{
						economic_group_id: economicGroup.id,
						business_unit_id: unit.id,
						description: `Cofre - ${unit.identification ?? "Não informado"}`,
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
			});
		} catch (error) {
			Logger.error(error.message);

			throw new InternalErrorException(
				"Erro na execução",
				500,
				"E_INTERNAL_ERROR",
			);
		}
	}

	public async addCollaborator(
		unitId: string,
		props: {
			userId: string;
			roleId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", unitId)
				.firstOrFail();

			const userToAdd = await User.query()
				.useTransaction(trx)
				.where("id", props.userId)
				.preload("roles")
				.firstOrFail();
			const hasRoleAlready = userToAdd.roles.find(
				(role) => role.role_id === props.roleId,
			);

			if (hasRoleAlready) {
				throw new BadRequestException(
					"Este usuário já é colaborador desta unidade",
					400,
					"E_ALREADY_EXISTS",
				);
			}

			await userToAdd.related("roles").create(
				{
					role_id: props.roleId,
					unit_id: unit.id,
					active: true,
				},
				{
					client: trx,
				},
			);

			await userToAdd
				.related("economicGroups")
				.sync([unit.economicGroupId], false, trx);
		});

		// role
		// unit
	}

	public async createCollaborator(
		authCtx: AuthContext,
		props: {
			roleId: number;
			name: string;
			email: string;
			password: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", authCtx.unit.id)
				.preload("economicGroup")
				.firstOrFail();

			const userAlreadyExists = await User.query()
				.useTransaction(trx)
				.whereRaw("lower(email) = lower(?)", [props.email])
				.where("system_id", unit.economicGroup.system_id)
				.first();

			if (userAlreadyExists) {
				throw new BadRequestException(
					"Este usuário já existe",
					400,
					"E_ALREADY_EXISTS",
				);
			}

			const userToAdd = await User.create(
				{
					name: props.name,
					email: props.email,
					password: props.password,
					system_id: authCtx.system.id,
					type: "user",
				},
				{
					client: trx,
				},
			);

			await userToAdd.related("roles").create(
				{
					role_id: props.roleId,
					unit_id: unit.id,
					active: true,
				},
				{
					client: trx,
				},
			);

			await userToAdd
				.related("economicGroups")
				.sync([unit.economicGroupId], false, trx);
		});
	}

	public async show(id: string) {
		const unit = await BusinessUnit.query()
			.where("id", id)
			.preload("economicGroup")
			.first();

		if (!unit) {
			throw new ResourceNotFoundException(
				"A unidade não foi encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		const jsonData = unit.toJSON();
		jsonData["fantasyName"] = jsonData["fantasy_name"];
		jsonData["companyName"] = jsonData["company_name"];
		jsonData["postalCode"] = jsonData["postal_code"];
		jsonData["stateRegistration"] = jsonData["state_registration"];
		jsonData["cityRegistration"] = jsonData["city_registration"];
		jsonData["cityCode"] = jsonData["city_code"];

		jsonData["fantasy_name"] = undefined;
		jsonData["company_name"] = undefined;
		jsonData["postal_code"] = undefined;
		jsonData["state_registration"] = undefined;
		jsonData["city_registration"] = undefined;
		jsonData["city_code"] = undefined;

		return jsonData;
	}

	public async update(
		id: string,
		data: IUpdateBusinessUnit,
	): Promise<BusinessUnit> {
		return Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", id)
				.preload("economicGroup")
				.first();

			if (!unit) {
				throw new ResourceNotFoundException(
					"A unidade não foi encontrada",
					404,
					"E_NOT_FOUND",
				);
			}

			if (data.document && data.document !== unit.document) {
				if (!validCNPJ(data.document)) {
					throw new BadRequestException(
						"Documento inválido",
						400,
						"E_INVALID_DOCUMENT",
					);
				}
				const hasUnitWithDocument = await unit.economicGroup
					.related("businessUnits")
					.query()
					.useTransaction(trx)
					.where("document", data.document)
					.first();
				if (hasUnitWithDocument) {
					throw new BadRequestException(
						`Este Cnpj já existe neste Grupo Economico para a Clinica "${
							unit.fantasyName ?? "-"
						}";`,
						400,
						"E_INVALID_DOCUMENT",
					);
				}
			}

			return unit
				.merge({
					identification: data.identification,
					fantasyName: data.fantasyName,
					companyName: data.companyName,
					email: data.email,
					document: data.document,
					phone: data.phone,
					postalCode: data.postalCode,
					address: data.address,
					number: data.number,
					complement: data.complement,
					district: data.district,
					city: data.city,
					state: data.state,
					active: data.active,

					stateRegistration: data.stateRegistration,
					cityRegistration: data.cityRegistration,
					cnae: data.cnae,
					simple: data.simple,
					cityCode: data.cityCode,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async updateAcquirer(
		unitId: string,
		id: string,
		data: IBusinessUnitAcquirerData,
	) {
		await Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.where("id", unitId)
				.useTransaction(trx)
				.firstOrFail();

			const acquirer = await unit
				.related("acquirers")
				.query()
				.where("id", id)
				.first();

			if (!acquirer) {
				throw new ResourceNotFoundException(
					"Adquirente não encontrado",
					404,
					"ERR",
				);
			}

			await acquirer
				.merge({ document: data.document, active: data.active })
				.useTransaction(trx)
				.save();
		});
	}

	public async deleteAcquirer(unitId: string, id: string) {
		await Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.where("id", unitId)
				.useTransaction(trx)
				.firstOrFail();

			const acquirer = await unit
				.related("acquirers")
				.query()
				.where("id", id)
				.first();

			if (!acquirer) {
				throw new ResourceNotFoundException(
					"Adquirente não encontrado",
					404,
					"ERR",
				);
			}

			await acquirer.softDelete();
		});
	}

	public async updateUser(
		unitId: string,
		_: User,
		id: string,
		data: IUpdateUnitUser,
	) {
		// TODO enable later
		// if (!(await this.sharedService.userHasRoles(loggedUser, ['admin']))) {
		//   throw new BadRequestException(
		//     'Apenas administradores podem alterar usuários',
		//   );
		// }

		const user = await User.find(id);

		if (!user) {
			throw new ResourceNotFoundException(
				"Usuário não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (data.email && data.email !== user.email) {
			const existingUser = await User.findBy("email", data.email);
			if (existingUser) {
				throw new BadRequestException("E-mail já cadastrado");
			}
		}

		const { roles, ...sanitized } = data;

		if (roles?.length === 0) {
			throw new BadRequestException(
				"Não selecionar cargos vai desativar o usuário",
			);
		}

		Object.assign(user, sanitized);

		await user.load("roles", (query) => {
			query.where("unit_id", unitId);
			query.preload("role");
		});

		await Database.transaction(async (trx) => {
			await user
				.merge({
					name: data.name,
					email: data.email,
					document: data.document,
					phone: data.phone,
					postalCode: data.postalCode,
					address: data.address,
					number: data.number,
					district: data.district,
					city: data.city,
					state: data.state,
					inscription: data.inscription,
					licensingJob: data.licensingJob,
					onDuty: data.onDuty,
					birthDate: data.birthDate,
				})
				.useTransaction(trx)
				.save();

			if ((roles ?? []).length > 0) {
				await user.related("roles").query().delete().useTransaction(trx);

				// eslint-disable-next-line no-restricted-syntax
				for await (const role of roles ?? []) {
					await user.related("roles").create(
						{
							role_id: role,
							unit_id: unitId,
						},
						{
							client: trx,
						},
					);
				}
			}
		});

		return user;
	}

	public async getUserBusinessUnits(authCtx: AuthContext, data: ISearchClinic) {
		const query = BusinessUnit.query()
			.preload("economicGroup")
			.where("economic_group_id", authCtx.group.id);

		if (data.document) {
			query.where("document", "ilike", `%${data.document}%`);
		}

		if (data.name) {
			query.orWhere("fantasyName", "ilike", `%${data.name}%`);
			query.orWhere("companyName", "ilike", `%${data.name}%`);
		}

		if (data.identification) {
			query.where("identification", "ilike", `%${data.identification}%`);
		}

		const entities = await query;

		return entities.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			document: elem.document,
			fantasyName: elem.fantasyName,
			companyName: elem.companyName,
			phone: elem.phone,
			group: elem.economicGroup,
		}));
	}

	async searchUser(authCtx: AuthContext, id: string) {
		const user = await User.query()
			.where("id", id)
			.preload("roles", (query) => {
				query.preload("role").preload("unit").preload("deposit");

				query.whereHas("unit", (q) => {
					q.where("economic_group_id", authCtx.group.id);
				});
			})
			.first();

		if (!user) {
			throw new ResourceNotFoundException(
				"Usuário não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return {
			...user.toJSON(),
			roles: user.roles.map((f) => ({
				id: f.role.id,
				name: f.role.name,
				active: f.active,
				unit: {
					id: f.unit.id,
					name: f.unit.companyName ?? "-",
				},
				deposit: f.deposit ?? null,
			})),
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

		const doc = await BusinessUnit.findBy("document", document);

		return {
			valid: true,
			exists: Boolean(doc),
		};
	}

	public async calculateStates(unitId: string) {
		const unit = await BusinessUnit.query().where("id", unitId).firstOrFail();

		const egUnits = await BusinessUnit.query().where(
			"economic_group_id",
			unit.economicGroupId,
		);

		const states = egUnits.map((u) => u.state);
		return [...new Set(states)];
	}
}
