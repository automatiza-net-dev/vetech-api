import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IScheduleServiceTypeData from 'Contracts/interfaces/IScheduleServiceTypeData';
import { v4 } from 'uuid';

interface ISearch {
  group?: string;
  description?: string;
}

@inject()
export default class ScheduleServiceTypeService {
  constructor(private readonly sharedService: SharedService) {}

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

      qb.preload('serviceGroup');
      qb.preload('product');
    });

    const result = await groupQb;

    return result.map(group => group.types).flat();
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

    await type.load('product');

    if (isSuperAdmin) {
      return type;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (type.economic_group_id !== group.id) throw exception;

    return type;
  }

  public async store(
    _: User,
    unitId: string,
    data: Omit<IScheduleServiceTypeData, 'active'>,
  ): Promise<ScheduleServiceType> {
    const group = await this.sharedService.getUserGroup(unitId);
    const serviceGroup = await ScheduleServiceGroup.findOrFail(
      data.scheduleServiceGroupId,
    );

    return serviceGroup.related('types').create({
      id: v4(),
      economic_group_id: group.id,
      description: data.description,
      reservedMinutes: data.reservedMinutes,
      product_id: data.productId,
      allowReturn: data.allowReturn,
      active: true,
      resume: data.resume,
    });
  }

  public async update(
    _: User,
    __: string,
    id: string,
    data: IScheduleServiceTypeData,
  ): Promise<ScheduleServiceType> {
    const schedule = await ScheduleServiceType.find(id);

    if (!schedule) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    if (!schedule.economic_group_id) {
      throw new BadRequestException(
        'Recurso do sistema',
        400,
        'E_SYSTEM_RESOURCE',
      );
    }

    return schedule
      .merge({
        active: data.active,
        reservedMinutes: data.reservedMinutes,
        schedule_service_group_id: data.scheduleServiceGroupId,
        description: data.description,
        product_id: data.productId,
        allowReturn: data.allowReturn,
        resume: data.resume,
      })
      .save();
  }

  public async destroy(_: User, __: string, id: string): Promise<void> {
    const schedule = await ScheduleServiceType.find(id);

    if (!schedule) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    if (!schedule.economic_group_id) {
      throw new BadRequestException(
        'Recurso do sistema',
        400,
        'E_SYSTEM_RESOURCE',
      );
    }

    await schedule.softDelete();
  }
}
