import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Plan from 'App/Models/Plan';
import IPlanData from 'Contracts/interfaces/IPlanData';
import { v4 } from 'uuid';

@inject()
export default class PlanService {
  public async index(): Promise<Array<Plan>> {
    return Plan.all();
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
}
