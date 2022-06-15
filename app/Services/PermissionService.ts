import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Permission from 'App/Models/Permission';

@inject()
export default class PermissionService {
  public async index(): Promise<Array<Permission>> {
    return Permission.all();
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
}
