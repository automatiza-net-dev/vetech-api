import { inject } from '@adonisjs/fold';
import Role from 'App/Models/Role';

@inject()
export default class RoleService {
  public async index(): Promise<Array<Role>> {
    return Role.all();
  }
}
