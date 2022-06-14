import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';
import { IUpdateEconomicGroup } from 'Contracts/interfaces/UpdateEconomicGroup';

@inject()
export default class EconomicGroupService {
  public async index(): Promise<Array<EconomicGroup>> {
    return EconomicGroup.all();
  }

  public async show(id: string): Promise<EconomicGroup> {
    const group = await EconomicGroup.find(id);

    if (!group) {
      throw new ResourceNotFoundException(
        'O grupo econômico não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return group;
  }

  public async update(
    id: string,
    data: IUpdateEconomicGroup,
  ): Promise<EconomicGroup> {
    const group = await this.show(id);

    return group.merge(data).save();
  }

  public async getUsers(id: string): Promise<Array<User>> {
    const group = await this.show(id);
    return group.related('users').query();
  }
}
