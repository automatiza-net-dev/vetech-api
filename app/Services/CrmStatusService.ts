import { inject } from '@adonisjs/fold';
import CrmStatus, { CrmStatusType } from 'App/Models/CrmStatus';
import SharedService, { AuthContext } from 'App/Services/SharedService';

@inject()
export default class CrmStatusService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: { description?: string }) {
    const qb = CrmStatus.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('type', 'OP');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: number) {
    const elem = await CrmStatus.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('id', id)
      .first();

    if (!elem) {
      throw this.sharedService.ResourceNotFound();
    }

    return elem;
  }

  public async store(
    authCtx: AuthContext,
    data: {
      description: string;
      tag: string;
      type: CrmStatusType;
    },
  ) {
    return CrmStatus.create({
      system_id: authCtx.system.id,
      economic_group_id: authCtx.group.id,

      description: data.description,
      tag: data.tag,
      type: data.type,
    });
  }

  public async update(
    authCtx: AuthContext,
    id: number,
    data: {
      description: string;
      tag: string;
      type: CrmStatusType;
      active: boolean;
    },
  ) {
    const elem = await this.show(authCtx, id);

    return elem.merge(data).save();
  }

  public async destroy(authCtx: AuthContext, id: number) {
    const elem = await this.show(authCtx, id);

    return elem.delete();
  }
}
