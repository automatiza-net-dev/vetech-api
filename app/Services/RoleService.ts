import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Permission from 'App/Models/Permission';
import Role from 'App/Models/Role';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IManageRolePermissions from 'Contracts/interfaces/IManageRolePermissions';
import IRoleData from 'Contracts/interfaces/IRoleData';

interface ISearch {
  name?: string;
}

@inject()
export default class RoleService {
  constructor(private sharedService: SharedService) {}

  public async index(
    authCtx: AuthContext,
    data: ISearch,
  ): Promise<Array<Role>> {
    const qb = Role.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('type', 'system');

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    return qb;
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IRoleData, 'active'>,
  ): Promise<Role> {
    return Database.transaction(async trx => {
      const permissions = await Permission.query()
        .useTransaction(trx)
        .whereHas('systems', query => {
          query.where('system_id', authCtx.system.id);
        });

      const newRole = await Role.create(
        {
          name: data.name,
          type: 'system',
          system_id: authCtx.system.id,
          economic_group_id: authCtx.group.id,
        },
        {
          client: trx,
        },
      );

      await newRole.related('permissions').attach(
        permissions.map(p => p.id),
        trx,
      );

      return newRole;
    });
  }

  public async show(authCtx: AuthContext, id: number) {
    const role = await Role.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .first();

    if (!role) {
      throw new ResourceNotFoundException(
        'Cargo não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return {
      id: role.id,
      name: role.name,
      type: role.type,
    };
  }

  public async update(
    authCtx: AuthContext,
    id: number,
    data: IRoleData,
  ): Promise<Role> {
    const role = await Role.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .first();

    if (!role) {
      throw new ResourceNotFoundException(
        'Cargo não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return role
      .merge({
        name: data.name,
        active: data.active,
      })
      .save();
  }

  public async delete(authCtx: AuthContext, id: number): Promise<void> {
    const role = await Role.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .preload('users')
      .first();

    if (!role) {
      throw new ResourceNotFoundException(
        'Cargo não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    if (role.users.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir um cargo que possui permissões',
        400,
        'E_BAD_REQUEST',
      );
    }

    await role.softDelete();
  }

  public async rolePermissionMetadata(authCtx: AuthContext, id: number) {
    const role = await Role.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .first();

    if (!role) {
      throw this.sharedService.ResourceNotFound();
    }

    // .preload('permissions', query => {
    //     query.where('active', true);
    //     query.preload('screen').pivotColumns(['active']);
    //   })

    const permissions = await role
      .related('permissions')
      .query()
      .preload('screen')
      .pivotColumns(['active']);

    const screens = permissions.map(p => p.screen);
    const uniqueScreens = screens.filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i,
    );

    return uniqueScreens.map(screen => {
      const screenPermissions = permissions.filter(
        p => p.screen.id === screen.id,
      );

      return {
        id: screen.id,
        name: screen.name,
        permissions: screenPermissions.map(p => ({
          id: p.id,
          description: p.description,
          active: p.$extras.pivot_active,
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
    await Database.transaction(async trx => {
      const role = await Role.query()
        .useTransaction(trx)
        .where('id', data.roleId)
        .where('system_id', authCtx.system.id)
        .where('economic_group_id', authCtx.group.id)
        .first();

      if (!role) {
        throw this.sharedService.ResourceNotFound();
      }

      await role.related('permissions').sync(data.permissions, false, trx);
    });
  }

  public async manageRolePermissions(
    authCtx: AuthContext,
    data: IManageRolePermissions,
  ): Promise<void> {
    await Database.transaction(async trx => {
      const client = Database.connection();

      const roles = await Role.query()
        .useTransaction(trx)
        .where('system_id', authCtx.system.id)
        .where('economic_group_id', authCtx.group.id)
        .whereIn(
          'id',
          data.data.map(d => d.role),
        );

      const promises = roles.map(async role => {
        const permissions = data.data.find(
          d => d.role === role.id,
        )?.permissions;

        if (permissions) {
          const promises = permissions.map(async permission => {
            await client
              .from('role_permissions')
              .where('role_id', role.id)
              .where('permission_id', permission.id)
              .update({ active: permission.active });
          });

          await Promise.all(promises);
        }
      });
      await Promise.all(promises);
    });
  }
}
