import { inject } from '@adonisjs/fold';
import Reason from 'App/Models/Reason';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IReasonData from 'Contracts/interfaces/IReasonData';

interface ISearch {
  reason?: string;
  type?: string;
  requires_observation?: string;
  active?: string;
}

@inject()
export default class ReasonService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = Reason.query()
      .whereRaw('(economic_group_id is null or economic_group_id = ?)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id);

    if (data.reason) {
      qb.where('reason', 'ilike', `%${data.reason}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (typeof data.requires_observation !== 'undefined') {
      qb.where('requires_observation', data.requires_observation === 'true');
    }

    if (typeof data.active !== 'undefined') {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }

  public async show(authCtx: AuthContext, reasonId: string) {
    const reason = await Reason.query()
      .where('id', reasonId)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id)
      .first();

    if (!reason) {
      throw this.sharedService.ResourceNotFound();
    }

    return reason;
  }

  public async store(authCtx: AuthContext, data: Omit<IReasonData, 'active'>) {
    return Reason.create({
      reason: data.reason,
      type: data.type,
      requiresObservation: data.requiresObservation,
      economicGroupId: authCtx.group.id,
      system_id: authCtx.system.id,
    });
  }

  public async update(
    authCtx: AuthContext,
    reasonId: string,
    data: IReasonData,
  ) {
    const reason = await Reason.query()
      .where('id', reasonId)
      .where('system_id', authCtx.system.id)
      .first();

    if (!reason) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!reason.economicGroupId) {
      throw this.sharedService.SystemResource();
    }

    if (reason.economicGroupId !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return reason.merge(data).save();
  }

  public async destroy(authCtx: AuthContext, reasonId: string) {
    const reason = await Reason.query()
      .where('id', reasonId)
      .where('economic_group_id', authCtx.group.id)
      .where('system_id', authCtx.system.id)
      .first();

    if (!reason) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!reason.economicGroupId) {
      throw this.sharedService.SystemResource();
    }

    await reason.softDelete();
  }

  public async crmWinningReasons(authCtx: AuthContext) {
    return Reason.query()
      .where('system_id', authCtx.system.id)
      .where('type', 'CRM_W')
      .whereRaw('(economic_group_id is null or economic_group_id = ?)', [
        authCtx.group.id,
      ])
      .where('active', true);
  }

  public async crmLosingReasons(authCtx: AuthContext) {
    return Reason.query()
      .where('system_id', authCtx.system.id)
      .where('type', 'CRM_L')
      .whereRaw('(economic_group_id is null or economic_group_id = ?)', [
        authCtx.group.id,
      ])
      .where('active', true);
  }
}
