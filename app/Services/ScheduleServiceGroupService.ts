import { inject } from '@adonisjs/fold';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IScheduleServiceGroupData from 'Contracts/interfaces/IScheduleServiceGroupData';

@inject()
export default class ScheduleServiceGroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async store(
    user: User,
    unitId: string,
    data: Omit<IScheduleServiceGroupData, 'active'>,
  ): Promise<ScheduleServiceGroup> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);
    const group = isSuperAdmin
      ? null
      : await this.sharedService.getUserGroup(unitId);

    return ScheduleServiceGroup.create({
      economic_group_id: group ? group.id : undefined,
      description: data.description,
    });
  }
}
