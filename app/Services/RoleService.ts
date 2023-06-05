import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
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
      .where('economic_group_id', authCtx.group.id);

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    return qb;
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IRoleData, 'active'>,
  ): Promise<Role> {
    return Role.create({
      name: data.name,
      type: data.type,
      system_id: authCtx.system.id,
      economic_group_id: authCtx.group.id,
    });
  }

  public async show(authCtx: AuthContext, id: number) {
    const role = await Role.query()
      .debug(true)
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .preload('permissions', query => {
        query.where('active', true);
        query.preload('screen').pivotColumns(['active']);
      })
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
      permissions: role.permissions.map(p => ({
        id: p.id,
        control: p.control,
        description: p.description,
        active: p.$extras.pivot_active,
        screen: {
          id: p.screen.id,
          name: p.screen.name,
        },
      })),
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
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async delete(authCtx: AuthContext, id: number): Promise<void> {
    const role = await Role.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .preload('permissions')
      .first();

    if (!role) {
      throw new ResourceNotFoundException(
        'Cargo não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    if (role.permissions.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir um cargo que possui permissões',
        400,
        'E_BAD_REQUEST',
      );
    }

    await role.softDelete();
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
