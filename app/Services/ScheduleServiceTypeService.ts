import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import User from 'App/Models/User';
import ScheduleServiceGroupService from 'App/Services/ScheduleServiceGroupService';
import SharedService from 'App/Services/SharedService';
import IScheduleServiceTypeData from 'Contracts/interfaces/IScheduleServiceTypeData';
import { v4 } from 'uuid';

interface ISearch {
  group?: string;
  description?: string;
}

@inject()
export default class ScheduleServiceTypeService {
  constructor(
    private readonly sharedService: SharedService,
    private readonly groupService: ScheduleServiceGroupService,
  ) {}

  public async index(
    user: User,
    unitId: string,
    data: ISearch,
  ): Promise<Array<ScheduleServiceType>> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    const groupQb = ScheduleServiceGroup.query().where(
      'description',
      'like',
      `%${data.group ?? ''}%`,
    );

    if (!isSuperAdmin) {
      const group = await this.sharedService.getUserGroup(unitId);
      groupQb.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ]);
    }

    await groupQb.preload('types', qb => {
      qb.where('description', 'ilike', `%${data.description ?? ''}%`);
    });

    const result = await groupQb;

    const types = result.map(group => group.types).flat();

    await Promise.all(types.map(type => type.load('serviceGroup')));

    return types;
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
