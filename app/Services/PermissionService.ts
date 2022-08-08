import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Permission from 'App/Models/Permission';
import IPermissionData from 'Contracts/interfaces/PermissionData';

interface ISearch {
  name?: string;
}

@inject()
export default class PermissionService {
  public async index(data: ISearch): Promise<Array<Permission>> {
    const qb = Permission.query();

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    return qb;
  }

  public async store(data: IPermissionData): Promise<Permission> {
    return Permission.create(data);
  }

  public async show(id: number): Promise<Permission> {
    const permission = await Permission.find(id);

    if (!permission) {
      throw new ResourceNotFoundException(
        'Permissão não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return permission;
  }

  public async update(id: number, data: IPermissionData): Promise<Permission> {
    const permission = await this.show(id);
    return permission.merge(data).save();
  }

  public async delete(id: number): Promise<void> {
    const permission = await this.show(id);

    await permission.softDelete();
  }
}
