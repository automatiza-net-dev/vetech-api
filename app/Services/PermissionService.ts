import { inject } from '@adonisjs/fold';
import Permission from 'App/Models/Permission';

@inject()
export default class PermissionService {
  public async index(): Promise<Array<Permission>> {
    return Permission.all();
  }
}
