import { inject } from '@adonisjs/fold';
import AccountPlan from 'App/Models/AccountPlan';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IAccountPlanData from 'Contracts/interfaces/IAccountPlanData';

interface ISearch {
  unit?: string;
  description?: string;
  code?: string;
  type?: string;
  group?: string;
  parent?: string;
}

@inject()
export default class AccountPlanService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = AccountPlan.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id);

    if (data.unit) {
      qb.where('business_unit_id', data.unit);
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.code) {
      qb.where('code', 'ilike', `%${data.code}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.group) {
      qb.where('account_plan_group_id', data.group);
    }

    if (data.parent) {
      qb.where('parent_id', data.parent);
    }

    qb.preload('parent');
    qb.preload('group');

    return qb;
  }

  async tree(authCtx: AuthContext, data: ISearch) {
    const qb = AccountPlan.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id);

    if (data.unit) {
      qb.where('business_unit_id', data.unit);
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.code) {
      qb.where('code', 'ilike', `%${data.code}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.group) {
      qb.where('account_plan_group_id', data.group);
    }

    if (data.parent) {
      qb.where('parent_id', data.parent);
    }

    const result = await qb;

    const map = new Map();

    result.forEach(item => {
      map.set(item.id, {
        id: item.id,
        description: item.description,
        canSelect: true,
        children: [],
      });
    });

    result.forEach(item => {
      const node = map.get(item.id)!;

      if (item.parent_id) {
        const parent = map.get(item.parent_id)!;
        parent.children.push(node);
        parent.canSelect = false;
      }
    });

    return Array.from(map.values()).filter(node => node.children.length > 0);
  }

  async store(authCtx: AuthContext, data: Omit<IAccountPlanData, 'active'>) {
    return AccountPlan.create({
      code: data.code,
      description: data.description,
      type: data.type,
      business_unit_id: authCtx.unit.id,
      economic_group_id: authCtx.group.id,
      system_id: authCtx.system.id,
      account_plan_group_id: data.accountPlanGroupId,
      parent_id: data.parentId,
    });
  }

  async show(authCtx: AuthContext, id: string) {
    const qb = AccountPlan.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .preload('parent');

    const model = await qb.first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model;
  }

  async update(authCtx: AuthContext, id: string, data: IAccountPlanData) {
    const model = await this.show(authCtx, id);

    if (!model.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

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

  async destroy(authCtx: AuthContext, id: string) {
    const model = await this.show(authCtx, id);

    if (!model.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await model.softDelete();
  }
}
