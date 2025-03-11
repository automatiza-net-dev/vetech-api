import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Permission, { TPermissionType } from "App/Models/Permission";
import Role, { TRoleType } from "App/Models/Role";
import RoleProfileAccess from "App/Models/RoleProfileAccess";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IManageRolePermissions from "Contracts/interfaces/IManageRolePermissions";
import IRoleData from "Contracts/interfaces/IRoleData";

interface ISearch {
	name?: string;
	new?: string;
}

@inject()
export default class RoleService {
	constructor(private sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = Role.query()
			.where("system_id", authCtx.system.id)
			.where("economic_group_id", authCtx.group.id);

		if (authCtx.user.type === "user") {
			qb.whereIn("type", ["user", "both", "all"] as TRoleType[]);
		}

		if (authCtx.user.type === "controller") {
			qb.whereIn("type", ["controller", "both", "all"] as TRoleType[]);
		}

		if (authCtx.user.type === "system") {
			qb.whereIn("type", ["system", "all"] as TRoleType[]);
		}

		if (data.name) {
			qb.where("name", "ilike", `%${data.name}%`);
		}

		// if (data.new === "true") {
		// 	qb.whereHas("permissions", (q) => {
		// 		q.whereNull("status");
		// 	});
		// } else {
		// 	qb.whereHas("permissions", (q) => {
		// 		q.whereNotNull("status");
		// 	});
		// }

		const result = await qb;
		const permissions = await Database.from("role_permissions")
			.whereIn(
				"role_id",
				result.map((r) => r.id),
			)
			.whereNull("status");

		return result.map((r) => {
			return {
				...r.toJSON(),
				newItems: permissions.filter((p) => p.role_id === r.id).length > 0,
			};
		});
	}

	public async controllerIndex(
		systemID: number,
		data: ISearch,
	): Promise<Array<Role>> {
		const qb = Role.query()
			.where("system_id", systemID)
			// .where("economic_group_id", authCtx.group.id)
			.where("type", "controller" as TRoleType);

		if (data.name) {
			qb.where("name", "ilike", `%${data.name}%`);
		}

		return qb;
	}

	public async store(
		authCtx: AuthContext,
		data: Omit<IRoleData, "active">,
	): Promise<Role> {
		return Database.transaction(async (trx) => {
			const permissions = await Permission.query()
				.useTransaction(trx)
				.whereIn("type", ["user", "both"] as TRoleType[])
				.whereHas("systems", (query) => {
					query.where("system_id", authCtx.system.id);
				});

			const newRole = await Role.create(
				{
					system_id: authCtx.system.id,
					economic_group_id: authCtx.group.id,
					user_id: authCtx.user.id,

					name: data.name,
					type: "user",
					externalAccess: data.externalAccess,
				},
				{
					client: trx,
				},
			);

			await newRole.related("permissions").attach(
				permissions.map((p) => p.id),
				trx,
			);

			await RoleProfileAccess.createMany(
				data.profileAccessIdList.map((elem) => ({
					role_id: newRole.id,
					profile_access_id: elem,
					active: true,
				})),
				{ client: trx },
			);

			return newRole;
		});
	}

	public async storeController(
		authCtx: AuthContext,
		data: Omit<IRoleData, "active">,
	): Promise<Role> {
		return Database.transaction(async (trx) => {
			const permissions = await Permission.query()
				.useTransaction(trx)
				.whereIn("type", ["controller", "both"] as TRoleType[])
				.whereHas("systems", (query) => {
					query.where("system_id", authCtx.system.id);
				});

			const newRole = await Role.create(
				{
					name: data.name,
					type: "controller",
					system_id: authCtx.system.id,
					economic_group_id: authCtx.group.id,
					externalAccess: data.externalAccess,
				},
				{
					client: trx,
				},
			);

			await newRole.related("permissions").attach(
				permissions.map((p) => p.id),
				trx,
			);

			return newRole;
		});
	}

	public async show(authCtx: AuthContext, id: number) {
		const role = await Role.query()
			.where("system_id", authCtx.system.id)
			.where("economic_group_id", authCtx.group.id)
			.where("id", id)
			.first();

		if (!role) {
			throw new ResourceNotFoundException(
				"Cargo não foi encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return {
			id: role.id,
			name: role.name,
			type: role.type,
			externalAccess: role.externalAccess,
		};
	}

	public async update(
		authCtx: AuthContext,
		id: number,
		data: IRoleData,
	): Promise<Role> {
		return Database.transaction(async (trx) => {
			const role = await Role.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!role) {
				throw new ResourceNotFoundException(
					"Cargo não foi encontrado",
					404,
					"E_NOT_FOUND",
				);
			}

			await RoleProfileAccess.query()
				.useTransaction(trx)
				.where("role_id", role.id)
				.delete();

			await RoleProfileAccess.createMany(
				data.profileAccessIdList.map(
					(elem) => ({
						role_id: role.id,
						profile_access_id: elem,
						active: true,
					}),
					{ client: trx },
				),
			);

			return role
				.merge({
					name: data.name,
					externalAccess: data.externalAccess,
					active: data.active,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async updateController(
		systemID: number,
		id: number,
		data: IRoleData,
	): Promise<Role> {
		const role = await Role.query()
			.where("system_id", systemID)
			// .where("economic_group_id", authCtx.group.id)
			.where("type", "controller" as TRoleType)
			.where("id", id)
			.first();

		if (!role) {
			throw new ResourceNotFoundException(
				"Cargo não foi encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return role
			.merge({
				name: data.name,
				externalAccess: data.externalAccess,
				active: data.active,
			})
			.save();
	}

	public async delete(authCtx: AuthContext, id: number): Promise<void> {
		const role = await Role.query()
			.where("system_id", authCtx.system.id)
			.where("economic_group_id", authCtx.group.id)
			.where("id", id)
			.preload("users")
			.first();

		if (!role) {
			throw new ResourceNotFoundException(
				"Cargo não foi encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (role.users.length > 0) {
			throw new BadRequestException(
				"Não é possível excluir um cargo que possui permissões",
				400,
				"E_BAD_REQUEST",
			);
		}

		await role.softDelete();
	}

	public async deleteController(systemID: number, id: number): Promise<void> {
		const role = await Role.query()
			.where("system_id", systemID)
			// .where("economic_group_id", authCtx.group.id)
			.where("type", "controller" as TRoleType)
			.where("id", id)
			.preload("users")
			.first();

		if (!role) {
			throw new ResourceNotFoundException(
				"Cargo não foi encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (role.users.length > 0) {
			throw new BadRequestException(
				"Não é possível excluir um controle de acesso que está vinculado à usuários",
				400,
				"E_BAD_REQUEST",
			);
		}

		await role.softDelete();
	}

	public async rolePermissionMetadata(
		systemID: number,
		id: number,
		data: { type?: string; newItems?: string },
	) {
		const role = await Role.query()
			// .where("economic_group_id", authCtx.group.id)
			.where("system_id", systemID)
			.where("id", id)
			.first();

		if (!role) {
			throw this.sharedService.ResourceNotFound();
		}

		// .preload('permissions', query => {
		//     query.where('active', true);
		//     query.preload('screen').pivotColumns(['active']);
		//   })

		const qb = role
			.related("permissions")
			.query()
			.preload("screen")
			.pivotColumns(["active", "status"]);

		if (data.newItems === "true") {
			qb.whereRaw("role_permissions.status is null");
		} else if (data.newItems === "false") {
			qb.whereRaw("role_permissions.status is not null");
		}

		if (data.type === "user") {
			qb.whereIn("permissions.type", [
				"user",
				"both",
				"all",
			] as TPermissionType[]);
		}

		if (data.type === "controller") {
			qb.whereIn("permissions.type", [
				"controller",
				"both",
				"all",
			] as TPermissionType[]);
		}

		if (data.type === "system") {
			qb.whereIn("permissions.type", ["system", "all"] as TPermissionType[]);
		}

		const permissions = await qb;

		const screens = permissions.map((p) => p.screen).filter(Boolean);
		const uniqueScreens = screens.filter(
			(v, i, a) => a.findIndex((t) => t.id === v.id) === i,
		);

		return uniqueScreens.map((screen) => {
			const screenPermissions = permissions.filter(
				(p) => p.screen.id === screen.id,
			);

			return {
				id: screen.id,
				name: screen.name,
				permissions: screenPermissions.map((p) => ({
					id: p.id,
					description: p.description,
					controlId: p.control_id,
					active: p.$extras.pivot_status,
				})),
			};
		});
	}

	public async addPermissionsToRole(
		authCtx: AuthContext,
		data: {
			roleId: number;
			permissions: Array<number>;
		},
	) {
		await Database.transaction(async (trx) => {
			const role = await Role.query()
				.useTransaction(trx)
				.where("id", data.roleId)
				.where("system_id", authCtx.system.id)
				.where("economic_group_id", authCtx.group.id)
				.first();

			if (!role) {
				throw this.sharedService.ResourceNotFound();
			}

			await role.related("permissions").sync(data.permissions, false, trx);
		});
	}

	public async manageRolePermissions(
		systemID: number,
		data: IManageRolePermissions,
	): Promise<void> {
		await Database.transaction(async (trx) => {
			const client = Database.connection();

			const roles = await Role.query()
				.useTransaction(trx)
				.where("system_id", systemID)
				// .where("economic_group_id", authCtx.group.id)
				.whereIn(
					"id",
					data.data.map((d) => d.role),
				);

			const promises = roles.map(async (role) => {
				const permissions = data.data.find(
					(d) => d.role === role.id,
				)?.permissions;

				if (permissions) {
					const promises = permissions.map(async (permission) => {
						await client
							.from("role_permissions")
							.where("role_id", role.id)
							.where("permission_id", permission.id)
							.update({ status: Boolean(permission.active) });
					});

					await Promise.all(promises);
				}
			});
			await Promise.all(promises);
		});
	}

	public async searchRolePermissions(
		systemID: number,
		type: string | null,
		data: { id?: string; active?: string },
	) {
		const qb = Database.from("role_profile_accesses")
			.select(
				Database.raw(`roles.id as role_id,
       roles.name,
       roles.active,
       roles.external_access,
       profile_accesses.id as a_id,
       profile_accesses.description`),
			)
			.joinRaw(
				"join profile_accesses on role_profile_accesses.profile_access_id = profile_accesses.id",
			)
			.joinRaw("join roles on role_profile_accesses.role_id = roles.id")
			.where("roles.system_id", systemID);

		if (data.id) {
			qb.where("roles.id", data.id);
		}

		if (data.active) {
			qb.where("roles.active", data.active !== "0");
		}

		if (!type || type === "user") {
			qb.whereIn("profile_accesses.type", ["user", "both", "all"]);
		}
		if (type === "controller") {
			qb.whereIn("profile_accesses.type", ["controller", "both", "all"]);
		}
		if (type === "system") {
			qb.whereIn("profile_accesses.type", ["system", "both", "all"]);
		}

		const result = await qb;

		const uniqueRoles: number[] = result.reduce((acc: number[], curr) => {
			if (acc.includes(curr.role_id)) {
				return acc;
			}

			acc.push(curr.role_id);
			return acc;
		}, [] as number[]);

		const mappedRoles = uniqueRoles.map((roleID: number) => {
			return {
				id: roleID,
				name: result.find((r) => r.role_id === roleID)?.name,
				active: result.find((r) => r.role_id === roleID)?.active,
				externalAccess: result.find((r) => r.role_id === roleID)
					?.external_access,
				profiles: result
					.filter((r) => r.role_id === roleID)
					.map((r) => ({ id: r.a_id, description: r.description })),
			};
		});

		if (mappedRoles.length === 0) {
			return [];
		}

		if (data.id) {
			const mappedRole = mappedRoles.find(
				(r) => r.id === Number.parseInt(data.id ?? "-1"),
			);
			if (!mappedRole) {
				throw new BadRequestException(
					"Cargo não encontrado",
					400,
					"E_NOT_FOUND",
				);
			}

			return mappedRole;
		}

		return mappedRoles;
	}

	public async searchControllerRolePermissions(
		systemID: number,
		roleType: TRoleType,
		data: { id?: string; active?: string },
	) {
		const qb = Role.query()
			.where("system_id", systemID)
			.where("type", "controller" as TRoleType);

		if (data.id) {
			qb.where("id", data.id);
		}

		if (data.active) {
			qb.where("active", data.active !== "0");
		}

		qb.preload("permissions", (query) => {
			if (roleType === "user") {
				query.whereIn("type", ["user", "both", "all"] as TPermissionType[]);
			}

			if (roleType === "controller") {
				query.whereIn("type", [
					"controller",
					"both",
					"all",
				] as TPermissionType[]);
			}

			if (roleType === "system") {
				query.whereIn("type", ["system", "all"] as TPermissionType[]);
			}
		});

		qb.preload("accesses", (query) => {
			if (roleType === "user") {
				query.whereIn("type", ["user", "both", "all"] as TRoleType[]);
			}

			if (roleType === "controller") {
				query.whereIn("type", ["controller", "both", "all"] as TRoleType[]);
			}

			if (roleType === "system") {
				query.whereIn("type", ["system", "all"] as TRoleType[]);
			}

			query.preload("profile");
		});

		const result = await qb;

		if (data.id) {
			if (result.length === 0) {
				throw this.sharedService.ResourceNotFound();
			}

			const [elem] = result;
			return {
				id: elem.id,
				name: elem.name,
				active: elem.active,
				externalAccess: elem.externalAccess,
				profiles: elem.accesses.map((access) => ({
					id: access.profile.id,
					description: access.profile.description,
				})),
			};
		}

		return result.map((elem) => ({
			id: elem.id,
			name: elem.name,
			active: elem.active,
			externalAccess: elem.externalAccess,
			profiles: elem.accesses.map((access) => ({
				id: access.profile.id,
				description: access.profile.description,
			})),
		}));
	}

	public async copyRole(systemID: number, data: { roleId: number }) {
		return await Database.transaction(async (trx) => {
			const role = await Role.query()
				.useTransaction(trx)
				.where("id", data.roleId)
				.where("system_id", systemID)
				.first();

			if (!role) {
				throw this.sharedService.ResourceNotFound();
			}

			const rolePermissions = await Database.from("role_permissions")
				.useTransaction(trx)
				.where("role_id", role.id);

			const roleProfileAccesses = await Database.from("role_profile_accesses")
				.useTransaction(trx)
				.where("role_id", role.id);

			const newRole = await Role.create(
				{
					name: `${role.name} - Cópia`,
					system_id: role.system_id,
					type: role.type,
					economic_group_id: role.economic_group_id,
					active: role.active,
					externalAccess: role.externalAccess,
				},
				{
					client: trx,
				},
			);

			await newRole.related("permissions").attach(
				rolePermissions.map((p) => p.permission_id),
				trx,
			);

			await newRole.related("accesses").createMany(
				roleProfileAccesses.map((p) => ({
					profile_access_id: p.profile_access_id,
				})),
				trx,
			);

			return newRole;
		});
	}
}
