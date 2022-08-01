import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import UnavailableDay from 'App/Models/UnavailableDay';
import IUnavailableDayData from 'Contracts/interfaces/IUnavailableDayData';

@inject()
export default class UnavailableDayService {
  public async index(
    unitId: string,
    user?: string,
  ): Promise<Array<UnavailableDay>> {
    const unit = await BusinessUnit.findOrFail(unitId);

    if (!user) {
      return unit.related('unavailableDays').query();
    }

    return unit.related('unavailableDays').query().where('user_id', user);
  }

  public async show(unitId: string, id: string): Promise<UnavailableDay> {
    const unavailableDay = await UnavailableDay.find(id);

    if (!unavailableDay || unavailableDay.business_unit_id !== unitId) {
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
    data: Omit<IUnavailableDayData, 'active'>,
  ): Promise<UnavailableDay> {
    const unit = await BusinessUnit.findOrFail(unitId);

    return unit.related('unavailableDays').create({
      user_id: data.userId,
      startHour: data.startHour,
      endHour: data.endHour,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: Omit<IUnavailableDayData, 'userId'>,
  ): Promise<UnavailableDay> {
    const unavailableDay = await this.show(unitId, id);

    return unavailableDay
      .merge({
        startHour: data.startHour,
        endHour: data.endHour,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const unavailableDay = await this.show(unitId, id);

    await unavailableDay.delete();
  }
}
