import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnit from "App/Models/BusinessUnit";
import ProfileAccess from "App/Models/ProfileAccess";
import RoleProfileAccess from "App/Models/RoleProfileAccess";
import System from "App/Models/System";
import ThirdPartyUserPermission from "App/Models/ThirdPartyUserPermission";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import axios from "axios";
import { AuthContract } from "@ioc:Adonis/Addons/Auth";
import Hash from "@ioc:Adonis/Core/Hash";
import Database from "@ioc:Adonis/Lucid/Database";

@inject()
export default class ThirdPartyService {
	private unauthotizedException = new BadRequestException(
		"Credenciais inválidas",
		400,
		"E_INVALID",
	);

	private getBaseUrl() {
		if (process.env.NODE_ENV === "development") {
			return "http://127.0.0.1:3333";
		}

		return "https://vetech-api.automatiza.net";
	}

	constructor(private sharedService: SharedService) {}

	public async updateToken(
		tpUser: ThirdPartyUserPermission,
		data: {
			userToken: string;
			unitId: string;
		},
	) {
		await tpUser.load("system");

		if (!tpUser.system) {
			throw new BadRequestException(
				"Sistema não encontrado",
				400,
				"E_NOT_FOUND",
			);
		}

		const unit = await BusinessUnit.query()
			.where("id", data.unitId)
			.preload("economicGroup")
			.firstOrFail();
		if (unit.economicGroup.system_id !== tpUser.system.id) {
			throw new BadRequestException(
				"Unidade não encontrada",
				400,
				"E_NOT_FOUND",
			);
		}

		// make request to change user token
		try {
			await axios.post(
				`${this.getBaseUrl()}/auth/swap-unit`,
				{
					unitId: data.unitId,
				},
				{
					headers: {
						Authorization: `Bearer ${data.userToken}`,
					},
				},
			);

			return {
				user: tpUser,
				unit,
			};
		} catch (error) {
			console.log("err?", error?.response?.data);

			throw new BadRequestException(
				error.response?.data?.message ?? "Token de usuário inválido",
				400,
			);
		}
	}

	public async authenticate(
		authContract: AuthContract,
		system: "Vetech" | "LiftOne" | "Sanclá",
		data: {
			key: string;
			password: string;
		},
	) {
		const tpUser = await ThirdPartyUserPermission.query()
			.where("key", data.key)
			.whereHas("system", (query) => {
				query.where("name", system);
			})
			.first();

		if (!tpUser) {
			throw this.unauthotizedException;
		}

		if (!(await Hash.verify(tpUser.password, data.password))) {
			throw this.unauthotizedException;
		}

		const token = await authContract.use("tpApi").generate(tpUser, {
			expiresIn: "1y",
		});

		return {
			token: token.token,
			expirates_at: token.expiresAt,
		};
	}

	public async extendedAuthenticate(
		authContract: AuthContract,
		system: "Vetech" | "LiftOne" | "Sanclá",
		data: {
			appKey: string;
			appPassword: string;

			userEmail: string;
			userPassword: string;
		},
	) {
		const tpUser = await ThirdPartyUserPermission.query()
			.where("key", data.appKey)
			.whereHas("system", (query) => {
				query.where("name", system);
			})
			.first();

		if (!tpUser) {
			throw this.unauthotizedException;
		}

		if (!(await Hash.verify(tpUser.password, data.appPassword))) {
			throw this.unauthotizedException;
		}

		const user = await User.query()
			.where("email", data.userEmail)
			.where("system_id", tpUser.system_id)
			.first();

		if (!user) {
			throw this.unauthotizedException;
		}

		if (!(await Hash.verify(user.password, data.userPassword))) {
			throw this.unauthotizedException;
		}

		const userSystem = await System.query()
			.where("id", tpUser.system_id)
			.preload("systemUrls")
			.firstOrFail();

		const userRoles = await user
			.related("roles")
			.query()
			.preload("role", (query) => {
				query.preload("permissions", (query) => {
					query.where("status", true);
				});

				query.preload("accesses", (query) => {
					query.preload("profile");
				});
			})
			.preload("unit", (query) => {
				query.preload("economicGroup");

				query.whereHas("economicGroup", (query) => {
					query.where("system_id", tpUser.system_id);
				});

				query.where("active", true);
			})
			.whereHas("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", tpUser.system_id);
				});

				query.where("active", true);
			})
			.where("active", true);

		const userToken = await authContract.use("api").generate(user, {
			expiresIn: "1w",
			system_id: tpUser.system_id,
		});

		const appToken = await authContract.use("tpApi").generate(tpUser, {
			expiresIn: "1y",
		});

		const profiles = userRoles
			.map((r) => r.role.accesses)
			.flatMap((ac) => ac.map((a) => a.profile))
			.filter((v, i, a) => a.indexOf(v) === i);

		return {
			app: {
				token: appToken.token,
				expirates_at: appToken.expiresAt,
			},
			user: {
				token: userToken.token,
				expirates_at: userToken.expiresAt,
				id: user.id,
				name: user.name,
				cpf: user.document,
				email: user.email,
				cep: user.postalCode,
				logradouro: user.address,
				numero: user.number,
				complemento: user.complement,
				bairro: user.district,
				cidade: user.city,
				uf: user.state,
			},
			units: userRoles.map((elem) => ({
				id: elem.unit.id,
				identification: elem.unit.identification,
				cnpj: elem.unit.document,
				razaoSocial: elem.unit.companyName,
				cep: elem.unit.postalCode,
				logradouro: elem.unit.address,
				numero: elem.unit.number,
				complemento: elem.unit.complement,
				bairro: elem.unit.district,
				cidade: elem.unit.city,
				uf: elem.unit.state,

				group: {
					id: elem.unit.economicGroup.id,
					fantasyName: elem.unit.economicGroup.fantasyName,
				},
			})),
			url: this.sharedService.captureGroup(
				userSystem.systemUrls.at(0),
				(v) => ({
					systemId: v.system_id,
					url: v.url,
				}),
			),
			profiles: profiles.map((elem) => ({
				id: elem.id,
				description: elem.description,
			})),
		};
	}

	public async businessUnitInfo(id: string) {
		const businessUnit = await BusinessUnit.query().where("id", id).first();

		if (!businessUnit) {
			throw new BadRequestException(
				"Unidade não encontrada",
				400,
				"E_NOT_FOUND",
			);
		}

		return {
			id: businessUnit.id ?? null,
			identificacao: businessUnit.identification ?? null,
			razaoSocial: businessUnit.companyName ?? null,
			nomeFantasia: businessUnit.fantasyName ?? null,
			cnpj: businessUnit.document ?? null,
			inscricaoEstadual: businessUnit.stateRegistration ?? null,
			inscricaoMunicipal: businessUnit.cityRegistration ?? null,
			email: businessUnit.email ?? null,
			telefone: businessUnit.phone ?? null,
			cep: businessUnit.postalCode ?? null,
			logradouro: businessUnit.address ?? null,
			numero: businessUnit.number ?? null,
			complemento: businessUnit.complement ?? null,
			bairro: businessUnit.district ?? null,
			cidade: businessUnit.city ?? null,
			uf: businessUnit.state ?? null,
			dataUltimaAtualizacao: businessUnit.updatedAt ?? null,
		};
	}

	public async userInfo(id: string) {
		const model = await User.query().where("id", id).first();

		if (!model) {
			throw new BadRequestException(
				"Usuário não encontrado",
				400,
				"E_NOT_FOUND",
			);
		}

		return {
			id: model.id ?? null,
			nome: model.name ?? null,
			cpf: model.document ?? null,
			rg: model.inscription ?? null,
			email: model.email ?? null,
			telefone: model.phone ?? null,
			cep: model.postalCode ?? null,
			logradouro: model.address ?? null,
			numero: model.number ?? null,
			complemento: model.complement ?? null,
			bairro: model.district ?? null,
			cidade: model.city ?? null,
			uf: model.state ?? null,
			dataUltimaAtualizacao: model.updatedAt ?? null,
		};
	}

	public async searchProfileAccesses(authCtx: AuthContext) {
		const result = await ProfileAccess.query()
			.where("system_id", authCtx.system.id)
			.where("active", true);

		return result.map((elem) => ({
			idPerfil: elem.id,
			descricao: elem.description,
		}));
	}

	public async syncProfileAccesses(
		_: AuthContext,
		data: { roleId: number; profileAccessIdList: number[] },
	) {
		await Database.transaction(async (trx) => {
			await RoleProfileAccess.query()
				.useTransaction(trx)
				.where("role_id", data.roleId)
				.delete();

			await RoleProfileAccess.createMany(
				data.profileAccessIdList.map(
					(elem) => ({
						role_id: data.roleId,
						profile_access_id: elem,
						active: true,
					}),
					{ client: trx },
				),
			);
		});
	}
}
