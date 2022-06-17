import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Role from 'App/Models/Role';
import PermissionService from 'App/Services/PermissionService';
import IAddPermissionToRole from 'Contracts/interfaces/AddPermissionToRole';
import IRoleData from 'Contracts/interfaces/IRoleData';

@inject()
export default class RoleService {
  constructor(private readonly permissionService: PermissionService) {}

  public async index(): Promise<Array<Role>> {
    return Role.all();
  }

  public async store(data: IRoleData): Promise<Role> {
    return Role.create(data);
  }

  public async show(id: number): Promise<Role> {
    const role = await Role.find(id);

    if (!role) {
      throw new ResourceNotFoundException(
        'Cargo não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return role;
  }

  public async update(id: number, data: IRoleData): Promise<Role> {
    const role = await this.show(id);

    return role.merge(data).save();
  }

  public async delete(id: number): Promise<void> {
    const role = await this.show(id);
    await role.softDelete();
  }

  public async addPermission(data: IAddPermissionToRole): Promise<void> {
    const role = await this.show(data.role_id);
    await role.load('permissions');

    const permission = await this.permissionService.show(data.permission_id);

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
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    const role = await this.show(roleId);

    await role.related('permissions').detach([permissionId]);
  }
}
