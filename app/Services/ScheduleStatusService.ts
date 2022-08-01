import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IScheduleStatusData from 'Contracts/interfaces/IScheduleStatusData';

@inject()
export default class ScheduleStatusService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(
    unitId: string,
    user: User,
  ): Promise<Array<ScheduleStatus>> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return ScheduleStatus.all();
    }

    const group = await this.sharedService.getUserGroup(unitId);
    return ScheduleStatus.query()
      .where('economic_group_id', group.id)
      .whereNull('deleted_at')
      .orWhereNull('economic_group_id');
  }

  public async show(
    unitId: string,
    user: User,
    id: string,
  ): Promise<ScheduleStatus> {
    const exception = new ResourceNotFoundException(
      'Recurso não foi encontrado',
      404,
      'E_NOT_FOUND',
    );

    const status = await ScheduleStatus.find(id);

    if (!status) throw exception;

    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);
    if (isSuperAdmin) {
      return status;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (status?.economic_group_id !== group.id) throw exception;

    return status;
  }

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

  public async update(
    unitId: string,
    user: User,
    id: string,
    data: IScheduleStatusData,
  ): Promise<ScheduleStatus> {
    const status = await this.show(unitId, user, id);

    return status
      .merge({
        description: data.description,
        color: data.color,
      })
      .save();
  }

  public async destroy(unitId: string, user: User, id: string): Promise<void> {
    const status = await this.show(unitId, user, id);

    await status.softDelete();
  }
}
