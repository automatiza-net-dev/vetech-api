import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Group from 'App/Models/Group';
import SharedService from 'App/Services/SharedService';
import IGroupData from 'Contracts/interfaces/IGroupData';

@inject()
export default class GroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string): Promise<Array<Group>> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('groups').query();
  }

  public async show(unitId: string, id: string): Promise<Group> {
    const group = await this.sharedService.getUserGroup(unitId);

    const model = await Group.query()
      .where('id', id)
      .andWhere('economic_group_id', group.id)
      .first();

    if (!model) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return model;
  }

  public async store(
    unitId: string,
    data: Omit<IGroupData, 'active'>,
  ): Promise<Group> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('groups').create({
      name: data.name,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IGroupData,
  ): Promise<Group> {
    const model = await this.show(unitId, id);

    return model.merge({
      name: data.name,
      active: data.active,
    });
  }
}
