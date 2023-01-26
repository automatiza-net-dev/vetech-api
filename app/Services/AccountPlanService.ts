import { inject } from '@adonisjs/fold';
import AccountPlan from 'App/Models/AccountPlan';
import SharedService from 'App/Services/SharedService';
import IAccountPlanData from 'Contracts/interfaces/IAccountPlanData';

interface ISearch {
  description?: string;
  code?: string;
  type?: string;
}

@inject()
export default class AccountPlanService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const qb = AccountPlan.query().where('business_unit_id', unitId);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.code) {
      qb.where('code', 'ilike', `%${data.code}%`);
    }

    if (data.type) {
      qb.where('ilike', data.type);
    }

    return qb;
  }

  async store(unitId: string, data: Omit<IAccountPlanData, 'active'>) {
    return AccountPlan.create({
      code: data.code,
      description: data.description,
      type: data.type,
      business_unit_id: unitId,
      account_plan_group_id: data.accountPlanGroupId,
      parent_id: data.parentId,
    });
  }

  async show(unitId: string, id: string) {
    const qb = AccountPlan.query()
      .where('business_unit_id', unitId)
      .where('id', id);

    const model = await qb.first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model;
  }

  async update(unitId: string, id: string, data: IAccountPlanData) {
    const model = await this.show(unitId, id);

    return model
      .merge({
        code: data.code,
        description: data.description,
        type: data.type,
        active: data.active,
        account_plan_group_id: data.accountPlanGroupId,
        parent_id: data.parentId,
      })
      .save();
  }

  async destroy(unitId: string, id: string) {
    const model = await this.show(unitId, id);

    await model.softDelete();
  }
}
