import { inject } from '@adonisjs/fold';
import Role from 'App/Models/Role';
import ICreateRole from 'Contracts/interfaces/CreateRole';

@inject()
export default class RoleService {
  public async index(): Promise<Array<Role>> {
    return Role.all();
  }

  public async store(data: ICreateRole): Promise<Role> {
    return Role.create(data);
  }
}
