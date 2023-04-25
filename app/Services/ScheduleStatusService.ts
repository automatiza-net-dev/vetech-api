import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IScheduleStatusData from 'Contracts/interfaces/IScheduleStatusData';

interface ISearch {
  description?: string;
}

@inject()
export default class ScheduleStatusService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(
    authCtx: AuthContext,
    data: ISearch,
  ): Promise<Array<ScheduleStatus>> {
    const qb = ScheduleStatus.query();

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    qb.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
      authCtx.group.id,
    ]).where('system_id', authCtx.system.id);

    return qb;
  }

  public async show(authCtx: AuthContext, id: string): Promise<ScheduleStatus> {
    const exception = new ResourceNotFoundException(
      'Recurso não foi encontrado',
      404,
      'E_NOT_FOUND',
    );

    const status = await ScheduleStatus.query()
      .where('id', id)
      .where('system_id', authCtx.system.id)
      .first();

    if (!status) throw exception;

    if (!status.economic_group_id) {
      return status;
    }

    if (status.economic_group_id !== authCtx.group.id) throw exception;

    return status;
  }

  public async store(
    authCtx: AuthContext,
    data: IScheduleStatusData,
  ): Promise<ScheduleStatus> {
    return ScheduleStatus.create({
      color: data.color,
      description: data.description,
      economic_group_id: authCtx.group.id,
      system_id: authCtx.system.id,
    });
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IScheduleStatusData,
  ): Promise<ScheduleStatus> {
    const status = await this.show(authCtx, id);

    if (!status.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return status
      .merge({
        description: data.description,
        color: data.color,
      })
      .save();
  }

  public async destroy(authCtx: AuthContext, id: string): Promise<void> {
    const status = await this.show(authCtx, id);

    if (!status.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await status.softDelete();
  }
}
