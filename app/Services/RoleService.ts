import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Role from 'App/Models/Role';
import IRoleData from 'Contracts/interfaces/IRoleData';

@inject()
export default class RoleService {
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
}
