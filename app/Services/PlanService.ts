import { inject } from '@adonisjs/fold';
import Plan from 'App/Models/Plan';
import IPlanData from 'Contracts/interfaces/IPlanData';
import { v4 } from 'uuid';

@inject()
export default class PlanService {
  public async store(data: IPlanData): Promise<Plan> {
    if (data.default) {
      await Plan.query().where('default', true).update({ default: false });
    }

    return Plan.create({ id: v4(), ...data });
  }
}
