import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IScheduleServiceGroupData from 'Contracts/interfaces/IScheduleServiceGroupData';

interface ISearch {
  description?: string;
}

@inject()
export default class ScheduleServiceGroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(
    user: User,
    unitId: string,
    data: ISearch,
  ): Promise<Array<ScheduleServiceGroup>> {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    const qb = ScheduleServiceGroup.query()
      .preload('types')
      .where('active', true);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (isSuperAdmin) {
      return qb;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    qb.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
      group.id,
    ]);

    return qb;
  }

  public async show(
    user: User,
    unitId: string,
    id: string,
  ): Promise<ScheduleServiceGroup> {
    const model = await ScheduleServiceGroup.find(id);

    const exception = new ResourceNotFoundException(
      'Recurso não encontrado',
      404,
      'E_NOT_FOUND',
    );

    if (!model) throw exception;

    await model.load('types');

    if (!model.economic_group_id) {
      return model;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (model?.economic_group_id !== group.id) throw exception;

    return model;
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
      type: data.type,
    });
  }

  public async update(
    user: User,
    unitId: string,
    id: string,
    data: IScheduleServiceGroupData,
  ): Promise<ScheduleServiceGroup> {
    const model = await this.show(user, unitId, id);

    if (!model.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return model.merge(data).save();
  }

  public async destroy(user: User, unitId: string, id: string): Promise<void> {
    const model = await this.show(user, unitId, id);

    if (!model.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await model.softDelete();
  }
}
