import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
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

  public async show(unitId: string, id: string): Promise<WorkingDay> {
    const group = await this.sharedService.getUserGroup(unitId);

    const workingDay = await WorkingDay.find(id);

    if (!workingDay || workingDay.economic_group_id !== group.id) {
      throw new ResourceNotFoundException(
        'Jornada não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return workingDay;
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
