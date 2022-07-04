import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import UnavailableDay from 'App/Models/UnavailableDay';
import WorkingDay from 'App/Models/WorkingDay';
import SharedService from 'App/Services/SharedService';
import IUnavailableDayData from 'Contracts/interfaces/IUnavailableDayData';

@inject()
export default class UnavailableDayService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string): Promise<Array<UnavailableDay>> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('unavailableDays').query();
  }

  public async show(unitId: string, id: string): Promise<UnavailableDay> {
    const group = await this.sharedService.getUserGroup(unitId);

    const unavailableDay = await UnavailableDay.find(id);

    if (!unavailableDay || unavailableDay.economic_group_id !== group.id) {
      throw new ResourceNotFoundException(
        'Recurso não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return unavailableDay;
  }

  public async store(
    unitId: string,
    data: IUnavailableDayData,
  ): Promise<UnavailableDay> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('unavailableDays').create({
      user_id: data.userId,
      startHour: data.startHour,
      endHour: data.endHour,
    });
  }
}
