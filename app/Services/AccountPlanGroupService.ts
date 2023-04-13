import { inject } from '@adonisjs/fold';
import AccountPlanGroup from 'App/Models/AccountPlanGroup';
import SharedService from 'App/Services/SharedService';
import IAccountPlanGroupData from 'Contracts/interfaces/IAccountPlanGroupData';

interface ISearch {
  description?: string;
  type?: string;
}
@inject()
export default class AccountPlanGroupService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = AccountPlanGroup.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );

    if (data.description) {
      qb.whereILike('description', `%${data.description}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    return qb;
  }

  async store(unitId: string, data: Omit<IAccountPlanGroupData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);

    return AccountPlanGroup.create({
      economic_group_id: group.id,
      description: data.description,
      type: data.type,
    });
  }

  async show(unitId: string, id: number) {
    const group = await this.sharedService.getUserGroup(unitId);

    const model = await AccountPlanGroup.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ])
      .where('id', id)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model;
  }

  async update(unitId: string, id: number, data: IAccountPlanGroupData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const model = await AccountPlanGroup.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!model.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return model
      .merge({
        description: data.description,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  async remove(unitId: string, id: number) {
    const group = await this.sharedService.getUserGroup(unitId);

    const model = await AccountPlanGroup.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!model.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await model.delete();
  }
}
