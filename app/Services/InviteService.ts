import Mail from "@ioc:Adonis/Addons/Mail";
import Hash from "@ioc:Adonis/Core/Hash";
import Logger from "@ioc:Adonis/Core/Logger";
import Database from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import BusinessUnit from "App/Models/BusinessUnit";
import Invite from "App/Models/Invite";
import Role from "App/Models/Role";
import SystemUrl from "App/Models/SystemUrl";
import User from "App/Models/User";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IAcceptInvite from "Contracts/interfaces/IAcceptInvite";
import IAcceptInviteNewUser from "Contracts/interfaces/IAcceptInviteNewUser";
import IInviteData from "Contracts/interfaces/IInviteData";
import UserUnitRole from "App/Models/UserUnitRole";

export const DEFAULT_USER_NAME = "[NOT REGISTERED]";

@inject()
export default class InviteService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(user: User, unitId: string): Promise<Array<Invite>> {
		const group = await this.sharedService.getUserGroup(unitId);
		const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

		const qb = Invite.query().where("active", true);

		if (isSuperAdmin) {
			return qb;
		}

		return qb.where("economic_group_id", group.id);
	}

	public async store(authCtx: AuthContext, data: IInviteData): Promise<Invite> {
		return Database.transaction(async (trx) => {
			const rows: {
				id_usuario: string;
				nome_usuario: string;
				id_grupo_economico: string | null;
				id_unidade: string | null;
			}[] = await Database.from("users")
				.select(
					Database.raw(`users.id                                as id_usuario,
       users.name                              as nome_usuario,
       users_economic_groups.economic_group_id as id_grupo_economico,
       user_unit_roles.unit_id                 as id_unidade`),
				)
				.joinRaw(
					"left join users_economic_groups on users.id = users_economic_groups.user_id",
				)
				.joinRaw(
					`left join user_unit_roles
                   ON user_unit_roles.user_id = users.id and user_unit_roles.unit_id = ?`,
					[authCtx.unit.id],
				)
				.whereRaw("users.email = ?", [data.email])
				.whereRaw("users_economic_groups.economic_group_id = ?", [
					authCtx.group.id,
				])
				.whereRaw("users.deleted_at is null", [])
				.whereRaw("users.system_id = ?", [authCtx.system.id]);

			// E-mail não existe em nenhum grupo economico do sistema logado;
			if (rows.length === 0) {
				const invite = await Invite.create(
					{
						invited_by_user_id: authCtx.user.id,
						economic_group_id: authCtx.group.id,
						role_id: data.roleId,
						business_unit_id: authCtx.unit.id,
						email: data.email,
						active: true,
					},
					{ client: trx },
				);

				const systemUrl = await SystemUrl.query()
					.useTransaction(trx)
					.where("system_id", authCtx.system.id)
					.first();
				if (!systemUrl) {
					throw new InternalErrorException(
						"Sistema sem url configurada",
						500,
						"E_ERR",
					);
				}

				const url = [
					systemUrl.url.endsWith("/") ? systemUrl.url : `${systemUrl.url}/`,
					`convite/novo-usuario/${invite.id}'`,
				].join("");

				await this.sendInviteEmail(
					data.email,
					invite,
					url,
					authCtx.group.fantasyName || authCtx.group.companyName || "-",
				);

				return invite;
			}

			const row = rows[0];
			// Usuario existe no sistema mas não no grupo economico logado;
			if (!row.id_grupo_economico) {
				const invite = await Invite.create(
					{
						invited_by_user_id: authCtx.user.id,
						economic_group_id: authCtx.group.id,
						role_id: data.roleId,
						business_unit_id: authCtx.unit.id,
						user_id: row.id_usuario,
						email: data.email,
						active: true,
					},
					{ client: trx },
				);

				const systemUrl = await SystemUrl.query()
					.useTransaction(trx)
					.where("system_id", authCtx.system.id)
					.first();
				if (!systemUrl) {
					throw new InternalErrorException(
						"Sistema sem url configurada",
						500,
						"E_ERR",
					);
				}

				const url = [
					systemUrl.url.endsWith("/") ? systemUrl.url : `${systemUrl.url}/`,
					`convite/aceite/${invite.id}'`,
				].join("");

				await this.sendInviteEmail(
					data.email,
					invite,
					url,
					authCtx.group.fantasyName || authCtx.group.companyName || "-",
				);

				return invite;
			}

			// Usuario existe na unidade do convite
			if (row.id_unidade) {
				throw new BadRequestException(
					"Usuario já possui acesso à unidade solicitada",
					400,
					"E_ERR",
				);
			}

			// Usuario existe no grupo economico logado mas não na unidade do convite;
			const invite = await Invite.create(
				{
					invited_by_user_id: authCtx.user.id,
					economic_group_id: authCtx.group.id,
					role_id: data.roleId,
					business_unit_id: authCtx.unit.id,
					user_id: row.id_usuario,
					email: data.email,
					active: false,
				},
				{ client: trx },
			);
			await UserUnitRole.create(
				{
					unit_id: authCtx.unit.id,
					role_id: data.roleId,
					user_id: row.id_usuario,
					active: false,
				},
				{ client: trx },
			);

			return invite;
		});
	}

	public async show(id: string): Promise<Invite> {
		const invite = await Invite.query()
			.preload("businessUnit", (query) => {
				query.select("id", "identification");
			})
			.preload("user", (query) => {
				query.select("id", "email");
			})
			.preload("invitedBy", (query) => {
				query.select("id", "name");
			})
			.where("id", id)
			.first();

		if (!invite) {
			throw new ResourceNotFoundException(
				"Convite não existe",
				404,
				"E_NOT_FOUND",
			);
		}

		return invite;
	}

	public async check(id: string) {
		const invite = await this.show(id);

		const user = await User.findBy("email", invite.email);

		if (!user) {
			throw new BadRequestException(
				"Convite sem usuário",
				400,
				"E_BAD_REQUEST",
			);
		}

		return {
			active: invite.active,
			user: user.name !== DEFAULT_USER_NAME,
		};
	}

	public async resendInvite(authCtx: AuthContext, id: string) {
		const invite = await Invite.query()
			.where("id", id)
			.andWhere("business_unit_id", authCtx.unit.id)
			.first();

		if (!invite) {
			throw new ResourceNotFoundException(
				"Convite não existe",
				404,
				"E_NO_INVITE",
			);
		}

		if (!invite.active) {
			throw new BadRequestException(
				"Convite não está ativo",
				400,
				"E_INVITE_NOT_ACTIVE",
			);
		}

		// await Mail.send((message) => {
		// 	message
		// 		.from("sysvetech@gmail.com")
		// 		.to(invite.email)
		// 		.subject("Convite - Vetech")
		// 		.htmlView("emails/invite", { id: invite.id });
		// });
		const url = await SystemUrl.query()
			.where("system_id", authCtx.system.id)
			.first();
		if (!url) {
			throw new BadRequestException(
				"Sistema sem url configurada",
				400,
				"E_ERR",
			);
		}

		await Mail.send((message) => {
			message
				.from("sysvetech@gmail.com")
				.to(invite.email)
				.subject("Convite para acesso ao sistema Sancla / Liftone / Vetech")
				.htmlView("emails/invite", {
					url: [
						url.url,
						url.url.endsWith("/") ? "" : "/",
						`invites?token=${invite.id}`,
					].join(""),

					id: invite.id,
					name: authCtx.group.fantasyName || authCtx.group.companyName || "-",
				});
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IInviteData,
	): Promise<Invite> {
		const invite = await this.show(id);
		if (!invite.active) {
			throw new UnauthorizedException(
				"Convite não está mais ativo",
				401,
				"E_NOT_AUTHORIZED",
			);
		}

		const role = await Role.findOrFail(data.roleId);
		const existingUser = await User.findBy("email", data.email);

		if (!existingUser) {
			throw new BadRequestException("Usuário não existe", 400, "E_BAD_REQUEST");
		}

		if (invite.role_id !== data.roleId) {
			const existingRole = await existingUser
				.related("roles")
				.query()
				.where("role_id", data.roleId)
				.first();

			if (existingRole) {
				throw new BadRequestException(
					"Convite já existe para o usuário/cargo",
					400,
					"E_BAD_REQUEST",
				);
			}
		}

		const url = await SystemUrl.query()
			.where("system_id", authCtx.system.id)
			.first();
		if (!url) {
			throw new BadRequestException(
				"Sistema sem url configurada",
				400,
				"E_ERR",
			);
		}

		await Mail.send((message) => {
			message
				.from("sysvetech@gmail.com")
				.to(data.email)
				.subject("Convite para acesso ao sistema Sancla / Liftone / Vetech")
				.htmlView("emails/invite", {
					url: [
						url.url,
						url.url.endsWith("/") ? "" : "/",
						`invites?token=${invite.id}`,
					].join(""),

					id: invite.id,
					name: authCtx.group.fantasyName || authCtx.group.companyName || "-",
				});
		});

		return invite
			.merge({
				business_unit_id: authCtx.unit.id,
				email: data.email,
				role_id: role.id,
				user_id: existingUser?.id,
			})
			.save();
	}

	public async acceptInvite(data: IAcceptInvite): Promise<void> {
		const invite = await this.show(data.id);

		if (!invite.active) {
			throw new BadRequestException(
				"Convite não está mais ativo",
				400,
				"E_BAD_REQUEST",
			);
		}

		await Database.transaction(async (trx) => {
			const user = await User.findBy("email", invite.email, { client: trx });

			if (!user) {
				throw new BadRequestException(
					"Usuário não encontrado",
					400,
					"E_BAD_REQUEST",
				);
			}

			if (
				user.email !== data.email ||
				!(await Hash.verify(user.password, data.password))
			) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			await invite.merge({ active: false }).useTransaction(trx).save();
			await user.related("roles").create({
				role_id: invite.role_id,
				unit_id: invite.business_unit_id,
				active: true,
			});
		});
	}

	public async acceptInviteForNewUser(
		data: IAcceptInviteNewUser,
	): Promise<void> {
		const invite = await this.show(data.id);

		if (!invite.active) {
			throw new BadRequestException(
				"Convite não está mais ativo",
				400,
				"E_BAD_REQUEST",
			);
		}

		return Database.transaction(async (trx) => {
			await invite.load("businessUnit", (query) => {
				query.preload("economicGroup");
			});

			const user = await User.create(
				{
					name: data.name,
					email: invite.email,
					password: data.password,
					phone: data.phone,
					system_id: invite.businessUnit.economicGroup.system_id,
					type: "user",
				},
				{ client: trx },
			);

			await user
				.related("economicGroups")
				.attach([invite.businessUnit.economicGroupId], trx);

			await invite.merge({ active: false }).useTransaction(trx).save();

			await user.related("roles").create({
				role_id: invite.role_id,
				unit_id: invite.business_unit_id,
				active: true,
			});
		});
	}

	public async destroy(id: string, user: User): Promise<void> {
		const invite = await this.show(id);
		const inviteBusinessUnit = await invite
			.related("businessUnit")
			.query()
			.firstOrFail();
		const userBusinessUnits = await this.userBusinessUnits(user);

		this.userIsRelatedToBusinessUnit(userBusinessUnits, inviteBusinessUnit);

		await invite.softDelete();
	}

	private userIsRelatedToBusinessUnit(
		userBusinessUnits: Array<BusinessUnit>,
		businessUnit: BusinessUnit,
	): void {
		const relatedBusinessUnit = userBusinessUnits.find(
			(u) => u.id === businessUnit.id,
		);

		if (!relatedBusinessUnit) {
			Logger.warn("Usuário não pode enviar convite");
			throw new UnauthorizedException(
				"Ação não permitida",
				401,
				"E_NOT_AUTHORIZED",
			);
		}
	}

	private async userBusinessUnits(user: User): Promise<Array<BusinessUnit>> {
		const entities = await user
			.related("economicGroups")
			.query()
			.preload("businessUnits");

		return entities.flatMap((ent) => ent.businessUnits);
	}
	private async sendInviteEmail(
		email: string,
		invite: Invite,
		url: string,
		unitName: string,
	) {
		await Mail.send((message) => {
			message
				.from("sysvetech@gmail.com")
				.to(email)
				.subject("Convite para acesso ao sistema Sancla / Liftone / Vetech")
				.htmlView("emails/invite", {
					link: url,
					id: invite.id,
					name: unitName,
				});
		});
	}
}
