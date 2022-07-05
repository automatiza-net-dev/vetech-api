import { inject } from '@adonisjs/fold';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IScheduleStatusData from 'Contracts/interfaces/IScheduleStatusData';

@inject()
export default class ScheduleStatusService {
  constructor(private readonly sharedService: SharedService) {}

  public async store(
    unitId: string,
    user: User,
    data: IScheduleStatusData,
  ): Promise<ScheduleStatus> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return ScheduleStatus.create({
        color: data.color,
        description: data.description,
      });
    }

    const group = await this.sharedService.getUserGroup(unitId);
    return group.related('scheduleStatuses').create({
      color: data.color,
      description: data.description,
    });
  }
}
