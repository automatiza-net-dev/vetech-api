import { inject } from "@adonisjs/fold";
import Mail from "@ioc:Adonis/Addons/Mail";
import Logger from "@ioc:Adonis/Core/Logger";
import Database from "@ioc:Adonis/Lucid/Database";
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
import { v4 } from "uuid";

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
			const role = await Role.findOrFail(data.role_id, { client: trx });
			const existingUser = await User.firstOrCreate(
				{
					email: data.email,
				},
				{
					name: DEFAULT_USER_NAME,
					password: v4(),
				},
				{
					client: trx,
				},
			);

			const existingRole = await existingUser
				.related("roles")
				.query()
				.useTransaction(trx)
				.where("role_id", role.id)
				.where("unit_id", authCtx.unit.id)
				.first();

			if (existingRole) {
				throw new BadRequestException(
					"Convite já existe para o usuário/cargo/unidade",
					400,
					"E_BAD_REQUEST",
				);
			}

			const existingInvite = await Invite.query()
				.useTransaction(trx)
				.where("role_id", role.id)
				.whereILike("email", `%${data.email}%`)
				.andWhere("user_id", existingUser.id)
				.andWhere("active", true)
				.first();
			if (existingInvite) {
				throw new BadRequestException(
					"Convite ativo já existe",
					400,
					"E_BAD_INVITE",
				);
			}

			const url = await SystemUrl.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.first();
			if (!url) {
				throw new BadRequestException(
					"Sistema sem url configurada",
					400,
					"E_ERR",
				);
			}

			await existingUser.related("roles").create(
				{
					role_id: role.id,
					unit_id: authCtx.unit.id,
					active: false,
				},
				{
					client: trx,
				},
			);

			await existingUser
				.related("economicGroups")
				.sync([authCtx.unit.economicGroupId], false, trx);

			const invite = await authCtx.unit.related("invites").create(
				{
					economic_group_id: authCtx.unit.economicGroupId,
					role_id: role.id,
					email: data.email,
					active: true,
					user_id: existingUser.id,
				},
				{
					client: trx,
				},
			);

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

			return invite;
		});
	}

	public async show(id: string): Promise<Invite> {
		const invite = await Invite.find(id);

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

		const role = await Role.findOrFail(data.role_id);
		const existingUser = await User.findBy("email", data.email);

		if (!existingUser) {
			throw new BadRequestException("Usuário não existe", 400, "E_BAD_REQUEST");
		}

		if (invite.role_id !== data.role_id) {
			const existingRole = await existingUser
				.related("roles")
				.query()
				.where("role_id", data.role_id)
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

		const user = await User.findBy("email", invite.email);

		if (!user) {
			throw new BadRequestException(
				"Usuário não encontrado",
				400,
				"E_BAD_REQUEST",
			);
		}

		if (user.name === DEFAULT_USER_NAME) {
			throw new BadRequestException(
				"Pedido inválido. Usuário não tem um cadastro válido",
				400,
				"E_BAD_REQUEST",
			);
		}

		const role = await user
			.related("roles")
			.query()
			.where("role_id", invite.role_id)
			.where("unit_id", invite.business_unit_id)
			.where("active", false)
			.preload("unit")
			.first();

		if (!role) {
			throw new BadRequestException(
				"Cargo não encontrado",
				400,
				"E_BAD_REQUEST",
			);
		}

		const trx = await Database.transaction();

		try {
			await role.merge({ active: true }).useTransaction(trx).save();
			await invite.merge({ active: false }).useTransaction(trx).save();
			await user
				.related("economicGroups")
				.attach([role.unit.economicGroupId], trx);

			await trx.commit();
		} catch (e) {
			await trx.rollback();
			Logger.error(e.message);

			throw new InternalErrorException(
				"Erro na execução",
				500,
				"E_INTERNAL_ERROR",
			);
		}
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

		const user = await User.findByOrFail("email", invite.email);
		const role = await user
			.related("roles")
			.query()
			.where("role_id", invite.role_id)
			.where("unit_id", invite.business_unit_id)
			.where("active", false)
			.preload("unit")
			.first();

		if (!role) {
			throw new BadRequestException(
				"Cargo não encontrado",
				400,
				"E_BAD_REQUEST",
			);
		}

		const trx = await Database.transaction();

		try {
			await user
				.merge({ name: data.name, password: data.password, phone: data.phone })
				.useTransaction(trx)
				.save();
			await role.merge({ active: true }).useTransaction(trx).save();
			await invite.merge({ active: false }).useTransaction(trx).save();
			await user
				.related("economicGroups")
				.attach([role.unit.economicGroupId], trx);

			await trx.commit();
		} catch (e) {
			await trx.rollback();
			Logger.error(e.message);

			throw new InternalErrorException(
				"Erro na execução",
				500,
				"E_INTERNAL_ERROR",
			);
		}
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
}
