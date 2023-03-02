import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';
import { IUpdateEconomicGroup } from 'Contracts/interfaces/UpdateEconomicGroup';

interface ISearch {
  name?: string;
}

interface ISearchUser {
  name?: string;
  document?: string;
  phone?: string;
  role?: number;
}

@inject()
export default class EconomicGroupService {
  public async index(data: ISearch): Promise<Array<EconomicGroup>> {
    const qb = EconomicGroup.query();

    if (data.name) {
      qb.where('fantasy_name', 'ilike', `%${data.name}%`);
      qb.orWhere('company_name', 'ilike', `%${data.name}%`);
    }

    return qb;
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
    const group = await EconomicGroup.find(id);

    if (!group) {
      throw new ResourceNotFoundException(
        'O grupo econômico não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return group.merge(data).save();
  }

  public async getUsers(id: string, data: ISearchUser): Promise<Array<User>> {
    const group = await EconomicGroup.find(id);

    if (!group) {
      throw new ResourceNotFoundException(
        'O grupo econômico não foi encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    const qb = group.related('users').query().debug(true);

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.document) {
      qb.where('document', 'ilike', `%${data.document}%`);
    }

    if (data.phone) {
      qb.where('phone', 'ilike', `%${data.phone}%`);
    }

    if (data.role) {
      qb.whereHas('roles', query => {
        query.where('role_id', data.role ?? '');
      });
    }

    return qb;
  }

  public async userEconomicGroups(user: User): Promise<Array<EconomicGroup>> {
    return user.related('economicGroups').query();
  }
}
