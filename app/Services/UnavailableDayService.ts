import { inject } from '@adonisjs/fold';
import UnavailableDay from 'App/Models/UnavailableDay';
import SharedService from 'App/Services/SharedService';
import IUnavailableDayData from 'Contracts/interfaces/IUnavailableDayData';

@inject()
export default class UnavailableDayService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string): Promise<Array<UnavailableDay>> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('unavailableDays').query();
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
