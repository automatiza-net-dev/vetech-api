import { inject } from '@adonisjs/fold';
import WorkingDay from 'App/Models/WorkingDay';
import SharedService from 'App/Services/SharedService';
import IWorkingDayData from 'Contracts/interfaces/IWorkingDayData';
import { v4 } from 'uuid';

@inject()
export default class WorkingDayService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string): Promise<Array<WorkingDay>> {
    const group = await this.sharedService.getUserGroup(unitId);
    return group.related('workingDays').query();
  }

  public async store(
    unitId: string,
    data: IWorkingDayData,
  ): Promise<WorkingDay> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('workingDays').create({
      id: v4(),
      user_id: data.userId,
      weekDay: data.dayOfWeek,
      startHour: data.startHour,
      endHour: data.endHour,
    });
  }
}
