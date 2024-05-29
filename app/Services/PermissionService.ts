import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Permission, { TPermissionType } from "App/Models/Permission";
import Role from "App/Models/Role";
import { TScreenType } from "App/Models/Screen";
import { AuthContext } from "App/Services/SharedService";
import IPermissionData from "Contracts/interfaces/PermissionData";
import { DateTime } from "luxon";

interface ISearch {
	description?: string;
}

type MenuRow = {
	menu_id: number;
	menu_descricao: string;
	menu_icon: string | null;
	menu_rota: string | null;
	menu_ordem: number;
	tela: string;
	permissao_id: number;
	permissao_ordem: number;
	permissao_descricao: string;
	permissao_icon: string | null;
	permissao_rota: string | null;
};

@inject()
export default class PermissionService {
	public async index(
		authCtx: AuthContext,
		data: ISearch,
	): Promise<Array<Permission>> {
		const qb = Permission.query().whereHas("systems", (query) => {
			query.where("system_id", authCtx.system.id);
		});

		if (authCtx.user.type === "user") {
			qb.whereIn("type", ["user", "both", "all"] as TPermissionType[]);
		}

		if (authCtx.user.type === "controller") {
			qb.whereIn("type", ["controller", "both", "all"] as TPermissionType[]);
		}

		if (authCtx.user.type === "system") {
			qb.whereIn("type", ["system", "all"] as TPermissionType[]);
		}

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		return qb;
	}

	public async store(
		authCtx: AuthContext,
		data: IPermissionData,
	): Promise<Permission> {
		return Database.transaction(async (trx) => {
			const permission = await Permission.create(
				{
					control: data.control,
					description: data.description,
					control_id: data.controlId,
					screen_id: data.screenId,
				},
				{
					client: trx,
				},
			);

			await permission.related("systems").attach([authCtx.system.id], trx);

			return permission;
		});
	}

	public async fetchMenu(authCtx: AuthContext) {
		const rows = await Database.from("users")
			.select(
				Database.raw(`menus.id                as menu_id,
       menus.description       as menu_descricao,
       menus.icon              as menu_icon,
       menus.route             as menu_rota,
       menus."order"           as menu_ordem,

       screens."name"          as tela,

       permissions.id          as permissao_id,
       0                       as permissao_ordem,
       permissions.icon        as permissao_icon,
       permissions.description as permissao_descricao,
       permissions.route       as permissao_rota`),
			)
			.joinRaw(
				`join user_unit_roles
              on users.id = user_unit_roles.user_id and user_unit_roles.active = true and
                 user_unit_roles.unit_id = ?`,
				[authCtx.unit.id],
			)
			.joinRaw(
				`join roles on roles.id = user_unit_roles.role_id and roles.deleted_at is null and roles.active = true`,
			)
			.joinRaw(
				`join role_permissions on role_permissions.role_id = roles.id and role_permissions.active = true`,
			)
			.joinRaw(
				`join permissions on role_permissions.permission_id = permissions.id and permissions.deleted_at is null`,
			)
			.joinRaw(`join screens on screens.id = permissions.screen_id`)
			.joinRaw(`join menus on screens.menu_id = menus.id`)
			.where("users.id", authCtx.user.id)
			.whereILike("permissions.control_id", "%00")
			.where("role_permissions.active", true)
			.orderByRaw(
				'menus.id, menus."order", screens.id, screens."name", permissions.control_id',
			)
			.exec();

		const reportRows = await Database.from("users")
			.select(
				Database.raw(`
        menus.id                                                                               as menu_id,
        menus.description                                                                      as menu_descricao,
        menus.icon                                                                             as menu_icon,
        menus.route                                                                            as menu_rota,
        menus."order"                                                                          as menu_ordem,
        SUBSTRING(permissions.description, 11, position(' -' in permissions.description) - 11) as tela,
        permissions.id                                                                         as permissao_id,
        0                                                                                      as permissao_ordem,
        permissions.icon                                                                       as permissao_icon,
        SUBSTRING(permissions.description, position('- ' in permissions.description) + 2)      as permissao_descricao,
        permissions.route                                                                      as permissao_rota
                     `),
			)
			.joinRaw(
				`join user_unit_roles
              on users.id = user_unit_roles.user_id and user_unit_roles.active = true and
                 user_unit_roles.unit_id = ?`,
				[authCtx.unit.id],
			)
			.joinRaw(
				`join roles on roles.id = user_unit_roles.role_id and roles.deleted_at is null and roles.active = true`,
			)
			.joinRaw(
				`join role_permissions on role_permissions.role_id = roles.id and role_permissions.active = true`,
			)
			.joinRaw(
				`join permissions on role_permissions.permission_id = permissions.id and permissions.deleted_at is null`,
			)
			.joinRaw(`join screens on screens.id = permissions.screen_id`)
			.joinRaw(`join menus on screens.menu_id = menus.id`)
			.where("users.id", authCtx.user.id)
			.whereILike("permissions.control_id", "REL%")
			.where("role_permissions.active", true)
			.orderByRaw(
				`menus.id, menus."order",
         SUBSTRING(permissions.description, 11, position(' -' in permissions.description) - 11),
         SUBSTRING(permissions.description, position('- ' in permissions.description) + 2)`,
			)
			.exec();

		const typedRows = rows as MenuRow[];
		const typedReportRows = reportRows as MenuRow[];

		const dataMap: Map<
			number,
			{
				id: number;
				order: number;
				icon: string | null;
				title: string;
				route: string | null;
			}[]
		> = new Map();
		for (const row of typedRows) {
			if (!dataMap.has(row.menu_id)) {
				dataMap.set(row.menu_id, []);
			}

			const entry = dataMap.get(row.menu_id)!;
			entry.push({
				id: row.permissao_id,
				order: row.permissao_ordem,
				icon: row.permissao_icon,
				title: row.tela,
				route: row.permissao_rota,
			});
		}

		for (const row of typedReportRows) {
			if (!dataMap.has(row.menu_id)) {
				dataMap.set(row.menu_id, []);
			}

			const entry = dataMap.get(row.menu_id)!;
			entry.push({
				id: row.permissao_id,
				order: row.permissao_ordem,
				icon: row.permissao_icon,
				title: row.tela,
				route: row.permissao_rota,
			});
		}

		const typedResult = Array.from(dataMap.keys())
			.map((key) => {
				const info = typedRows.find((r) => r.menu_id === key);
				if (!info) {
					return null;
				}

				const value = dataMap.get(key)!;

				return {
					id: info.menu_id,
					order: info.menu_ordem,
					title: info.menu_descricao,
					route: info.menu_rota,
					icon: info.menu_icon,
					items: value,
				};
			})
			.filter(Boolean);

		const typedReportResult = Array.from(dataMap.keys())
			.map((key) => {
				const info = typedReportRows.find((r) => r.menu_id === key);
				if (!info) {
					return null;
				}

				const value = dataMap.get(key)!;

				return {
					id: info.menu_id,
					order: info.menu_ordem,
					title: info.menu_descricao,
					route: info.menu_rota,
					icon: info.menu_icon,
					items: value,
				};
			})
			.filter(Boolean);

		return {
			status: 200,
			title: "Ok",
			message: null,
			validationErrors: {},
			data: {
				items: [...typedResult, ...typedReportResult],
			},
		};
	}

	public async fetchScreens(authCtx: AuthContext, data: { term: string }) {
		return Permission.query()
			.whereHas("systems", (query) => {
				query.where("system_id", authCtx.system.id);
			})
			.whereHas("screen", (query) => {
				query.whereILike("name", `%${data.term}%`);
			})
			.preload("screen", (query) => {
				if (authCtx.user.type === "user") {
					query.whereIn("type", ["user", "both", "all"] as TScreenType[]);
				}

				if (authCtx.user.type === "controller") {
					query.whereIn("type", ["controller", "both", "all"] as TScreenType[]);
				}

				if (authCtx.user.type === "system") {
					query.whereIn("type", ["system", "all"] as TScreenType[]);
				}
			});
	}

	public async show(authCtx: AuthContext, id: number): Promise<Permission> {
		const permission = await Permission.query()
			.where("id", id)
			.whereHas("systems", (query) => {
				query.where("system_id", authCtx.system.id);
			})
			.first();

		if (!permission) {
			throw new ResourceNotFoundException(
				"Permissão não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		return permission;
	}

	public async update(
		authCtx: AuthContext,
		id: number,
		data: IPermissionData,
	): Promise<Permission> {
		const permission = await this.show(authCtx, id);
		return permission
			.merge({
				control: data.control,
				control_id: data.controlId,
				description: data.description,
				screen_id: data.screenId,
			})
			.save();
	}

	public async delete(authCtx: AuthContext, id: number): Promise<void> {
		const permission = await this.show(authCtx, id);

		await permission.softDelete();
	}

	async syncPermissions() {
		await Database.transaction(async (trx) => {
			const permissions = await Permission.query()
				.useTransaction(trx)
				.whereNull("updated_at")
				.preload("systems")
				.preload("roles");

			const deleteTasks = permissions.map(async (permission) => {
				return Database.from("systems_permissions")
					.where("permission_id", permission.id)
					.delete();
			});
			await Promise.all(deleteTasks);

			const syncTasks = permissions.map(async (permission) => {
				return permission.$systems.map(async (system) => {
					return Database.table("systems_permissions").insert({
						system_id: system,
						permission_id: permission.id,
					});
				});
			});
			await Promise.all(syncTasks);

			const roles = await Role.query().useTransaction(trx);
			const rolesTasks = roles.map(async (role) => {
				return role.related("permissions").sync(
					permissions
						.filter((p) => p.$systems.includes(role.system_id))
						.map((p) => p.id),
					false,
					trx,
				);
			});
			await Promise.all(rolesTasks);

			await Permission.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					permissions.map((r) => r.id),
				)
				.update({
					updated_at: DateTime.now(),
				});
		});
	}
}
