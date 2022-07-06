import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import User from 'App/Models/User';
import ScheduleServiceGroupService from 'App/Services/ScheduleServiceGroupService';
import SharedService from 'App/Services/SharedService';
import IScheduleServiceTypeData from 'Contracts/interfaces/IScheduleServiceTypeData';
import { v4 } from 'uuid';

@inject()
export default class ScheduleServiceTypeService {
  constructor(
    private readonly sharedService: SharedService,
    private readonly groupService: ScheduleServiceGroupService,
  ) {}

  public async index(
    user: User,
    unitId: string,
  ): Promise<Array<ScheduleServiceType>> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return ScheduleServiceType.all();
    }

    const group = await this.sharedService.getUserGroup(unitId);

    return ScheduleServiceType.query()
      .where('economic_group_id', group.id)
      .orWhereNull('economic_group_id');
  }

  public async show(
    user: User,
    unitId: string,
    id: string,
  ): Promise<ScheduleServiceType> {
    const type = await ScheduleServiceType.find(id);

    const exception = new ResourceNotFoundException(
      'Recurso não encontrado',
      404,
      'E_NOT_FOUND',
    );

    if (!type) throw exception;

    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return type;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (type.economic_group_id !== group.id) throw exception;

    return type;
  }

  public async store(
    user: User,
    unitId: string,
    data: Omit<IScheduleServiceTypeData, 'active'>,
  ): Promise<ScheduleServiceType> {
    const group = await this.sharedService.getUserGroup(unitId);
    const serviceGroup = await this.groupService.show(
      user,
      unitId,
      data.scheduleServiceGroupId,
    );

    return serviceGroup.related('types').create({
      id: v4(),
      economic_group_id: group.id,
      description: data.description,
      reservedMinutes: data.reservedMinutes,
    });
  }

  public async update(
    user: User,
    unitId: string,
    id: string,
    data: IScheduleServiceTypeData,
  ): Promise<ScheduleServiceType> {
    const schedule = await this.show(user, unitId, id);

    if (data.scheduleServiceGroupId !== schedule.schedule_service_group_id) {
      await this.groupService.show(user, unitId, data.scheduleServiceGroupId);
    }

    return schedule
      .merge({
        active: data.active,
        reservedMinutes: data.reservedMinutes,
        schedule_service_group_id: data.scheduleServiceGroupId,
        description: data.description,
      })
      .save();
  }

  public async destroy(user: User, unitId: string, id: string): Promise<void> {
    const schedule = await this.show(user, unitId, id);

    await schedule.softDelete();
  }
}
