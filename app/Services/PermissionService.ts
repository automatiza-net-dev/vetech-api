import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Permission from 'App/Models/Permission';
import { AuthContext } from 'App/Services/SharedService';
import IPermissionData from 'Contracts/interfaces/PermissionData';

interface ISearch {
  name?: string;
}

@inject()
export default class PermissionService {
  public async index(
    authCtx: AuthContext,
    data: ISearch,
  ): Promise<Array<Permission>> {
    const qb = Permission.query().where('system_id', authCtx.system.id);

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    return qb;
  }

  public async store(
    authCtx: AuthContext,
    data: IPermissionData,
  ): Promise<Permission> {
    return Permission.create({
      ...data,
      system_id: authCtx.system.id,
    });
  }

  public async show(authCtx: AuthContext, id: number): Promise<Permission> {
    const permission = await Permission.query()
      .where('id', id)
      .where('system_id', authCtx.system.id)
      .first();

    if (!permission) {
      throw new ResourceNotFoundException(
        'Permissão não encontrada',
        404,
        'E_NOT_FOUND',
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
    return permission.merge(data).save();
  }

  public async delete(authCtx: AuthContext, id: number): Promise<void> {
    const permission = await this.show(authCtx, id);

    await permission.softDelete();
  }
}
