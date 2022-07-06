import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import WorkingDay from 'App/Models/WorkingDay';
import IWorkingDayData from 'Contracts/interfaces/IWorkingDayData';
import { v4 } from 'uuid';

@inject()
export default class WorkingDayService {
  public async index(unitId: string): Promise<Array<WorkingDay>> {
    const unit = await BusinessUnit.findOrFail(unitId);
    return unit.related('workingDays').query();
  }

  public async show(unitId: string, id: string): Promise<WorkingDay> {
    const workingDay = await WorkingDay.find(id);

    if (!workingDay || workingDay.business_unit_id !== unitId) {
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
    const unit = await BusinessUnit.findOrFail(unitId);

    return unit.related('workingDays').create({
      id: v4(),
      user_id: data.userId,
      weekDay: data.dayOfWeek,
      startHour: data.startHour,
      endHour: data.endHour,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: Omit<IWorkingDayData, 'userId'>,
  ): Promise<WorkingDay> {
    const workingDay = await this.show(unitId, id);

    return workingDay
      .merge({
        weekDay: data.dayOfWeek,
        startHour: data.startHour,
        endHour: data.endHour,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const workingDay = await this.show(unitId, id);

    await workingDay.delete();
  }
}
