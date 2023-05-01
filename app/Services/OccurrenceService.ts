import { inject } from '@adonisjs/fold';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IOccurrenceData from 'Contracts/interfaces/IOccurrenceData';

interface ISearch {
  description?: string;
  type?: OccurrenceType;
}

@inject()
export default class OccurrenceService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = Occurrence.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ]);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: string) {
    const qb = Occurrence.query()
      .where('id', id)
      .where('system_id', authCtx.system.id);

    const ent = await qb.first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!ent.economic_group_id) {
      return ent;
    }

    if (ent.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IOccurrenceData, 'active'>,
  ) {
    return Occurrence.create({
      description: data.description,
      type: data.type,
      economic_group_id: authCtx.group.id,
      system_id: authCtx.system.id,
    });
  }

  public async update(authCtx: AuthContext, id: string, data: IOccurrenceData) {
    const ent = await this.show(authCtx, id);

    if (!ent.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return ent
      .merge({
        description: data.description,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async destroy(authCtx: AuthContext, id: string) {
    const ent = await this.show(authCtx, id);

    if (!ent.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await ent.softDelete();
  }
}
