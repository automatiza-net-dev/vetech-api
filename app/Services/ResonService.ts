import { inject } from '@adonisjs/fold';
import Reason from 'App/Models/Reason';
import SharedService from 'App/Services/SharedService';
import IReasonData from 'Contracts/interfaces/IReasonData';

interface ISearch {
  reason?: string;
  type?: string;
  requires_observation?: string;
  active?: string;
}

@inject()
export default class ReasonService {
  constructor(private readonly sharedService: SharedService) { }

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Reason.query().whereRaw(
      '(economic_group_id is null or economic_group_id = ?)',
      [group.id],
    );

    if (data.reason) {
      qb.where('reason', 'ilike', `%${data.reason}%`);
    }

    if (data.type) {
      qb.where('type', `%${data.type}%`);
    }

    if (typeof data.requires_observation !== 'undefined') {
      qb.where('requires_observation', data.requires_observation === 'true');
    }

    if (typeof data.active !== 'undefined') {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }

  public async show(unitId: string, reasonId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const reason = await Reason.query()
      .where('id', reasonId)
      .where('economic_group_id', group.id)
      .first();

    if (!reason) {
      throw this.sharedService.ResourceNotFound();
    }

    return reason;
  }

  public async store(unitId: string, data: Omit<IReasonData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Reason.create({
      reason: data.reason,
      type: data.type,
      requiresObservation: data.requiresObservation,
      economicGroupId: group.id,
    });
  }

  public async update(unitId: string, reasonId: string, data: IReasonData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const reason = await Reason.query()
      .where('id', reasonId)
      .where('economic_group_id', group.id)
      .first();

    if (!reason) {
      throw this.sharedService.ResourceNotFound();
    }

    return reason.merge(data).save();
  }

  public async destroy(unitId: string, reasonId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const reason = await Reason.query()
      .where('id', reasonId)
      .where('economic_group_id', group.id)
      .first();

    if (!reason) {
      throw this.sharedService.ResourceNotFound();
    }

    await reason.softDelete();
  }
}
