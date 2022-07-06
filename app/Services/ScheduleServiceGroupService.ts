import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
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

    return ScheduleServiceGroup.query()
      .where('economic_group_id', group.id)
      .orWhereNull('economic_group_id');
  }

  public async show(
    user: User,
    unitId: string,
    id: string,
  ): Promise<ScheduleServiceGroup> {
    const schedule = await ScheduleServiceGroup.find(id);

    const exception = new ResourceNotFoundException(
      'Recurso não encontrado',
      404,
      'E_NOT_FOUND',
    );

    if (!schedule) throw exception;

    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return schedule;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (schedule?.economic_group_id !== group.id) throw exception;

    return schedule;
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

  public async update(
    user: User,
    unitId: string,
    id: string,
    data: IScheduleServiceGroupData,
  ): Promise<ScheduleServiceGroup> {
    const schedule = await this.show(user, unitId, id);

    return schedule.merge(data).save();
  }

  public async destroy(user: User, unitId: string, id: string): Promise<void> {
    const schedule = await this.show(user, unitId, id);

    await schedule.softDelete();
  }
}
