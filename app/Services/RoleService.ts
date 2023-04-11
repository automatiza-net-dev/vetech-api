import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Role from 'App/Models/Role';
import PermissionService from 'App/Services/PermissionService';
import { AuthContext } from 'App/Services/SharedService';
import IAddPermissionToRole from 'Contracts/interfaces/AddPermissionToRole';
import IRoleData from 'Contracts/interfaces/IRoleData';

interface ISearch {
  name?: string;
}

@inject()
export default class RoleService {
  constructor(private readonly permissionService: PermissionService) {}

  public async index(
    authCtx: AuthContext,
    data: ISearch,
  ): Promise<Array<Role>> {
    const qb = Role.query().where('system_id', authCtx.system.id);

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    return qb;
  }

  public async store(authCtx: AuthContext, data: IRoleData): Promise<Role> {
    return Role.create({ ...data, system_id: authCtx.system.id });
  }

  public async show(authCtx: AuthContext, id: number): Promise<Role> {
    const role = await Role.query()
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .first();

    if (!role) {
      throw new ResourceNotFoundException(
        'Cargo não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    await role.load('permissions');

    return role;
  }

  public async update(
    authCtx: AuthContext,
    id: number,
    data: IRoleData,
  ): Promise<Role> {
    const role = await this.show(authCtx, id);

    return role.merge(data).save();
  }

  public async delete(authCtx: AuthContext, id: number): Promise<void> {
    const role = await this.show(authCtx, id);
    await role.softDelete();
  }

  public async addPermission(
    authCtx: AuthContext,
    data: IAddPermissionToRole,
  ): Promise<void> {
    const role = await this.show(authCtx, data.role_id);
    await role.load('permissions');

    const permission = await this.permissionService.show(
      authCtx,
      data.permission_id,
    );

    if (role.permissions.find(perm => perm.id === permission.id)) {
      throw new BadRequestException(
        'Permissão já pertence ao cargo',
        400,
        'E_BAD_REQUEST',
      );
    }

    await role.related('permissions').attach([permission.id]);
  }

  public async deletePermission(
    authCtx: AuthContext,
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    const role = await this.show(authCtx, roleId);

    await role.related('permissions').detach([permissionId]);
  }
}
