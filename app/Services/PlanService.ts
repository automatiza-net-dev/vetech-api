import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Plan from 'App/Models/Plan';
import IPlanData from 'Contracts/interfaces/IPlanData';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
}

@inject()
export default class PlanService {
  public async index(data: ISearch): Promise<Array<Plan>> {
    const qb = Plan.query();

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async store(data: IPlanData): Promise<Plan> {
    if (data.default) {
      await Plan.query().where('default', true).update({ default: false });
    }

    return Plan.create({ id: v4(), ...data });
  }

  public async show(id: string): Promise<Plan> {
    const plan = await Plan.find(id);

    if (!plan) {
      throw new ResourceNotFoundException(
        'Plano não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return plan;
  }

  public async update(id: string, data: IPlanData): Promise<Plan> {
    const plan = await this.show(id);

    if (data.default) {
      await Plan.query().where('default', true).update({ default: false });
    }

    return plan.merge(data).save();
  }

  public async remove(id: string): Promise<void> {
    const plan = await this.show(id);

    await plan.softDelete();
  }
}
