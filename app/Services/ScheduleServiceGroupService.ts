import { inject } from '@adonisjs/fold';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IScheduleServiceGroupData from 'Contracts/interfaces/IScheduleServiceGroupData';

@inject()
export default class ScheduleServiceGroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(
    user: User,
    unitId: string,
  ): Promise<Array<ScheduleServiceGroup>> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return ScheduleServiceGroup.all();
    }

    const group = await this.sharedService.getUserGroup(unitId);

    return ScheduleServiceGroup.query().where('economic_group_id', group.id);
  }

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
