import { inject } from '@adonisjs/fold';
import Group from 'App/Models/Group';
import SharedService from 'App/Services/SharedService';
import IGroupData from 'Contracts/interfaces/IGroupData';

@inject()
export default class GroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async store(
    unitId: string,
    data: Omit<IGroupData, 'active'>,
  ): Promise<Group> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('groups').create({
      name: data.name,
    });
  }
}
