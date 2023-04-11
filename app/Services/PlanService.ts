import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Plan from 'App/Models/Plan';
import { AuthContext } from 'App/Services/SharedService';
import IPlanData from 'Contracts/interfaces/IPlanData';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
}

@inject()
export default class PlanService {
  public async index(
    authCtx: AuthContext,
    data: ISearch,
  ): Promise<Array<Plan>> {
    const qb = Plan.query().where('system_id', authCtx.system.id);

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async store(authCtx: AuthContext, data: IPlanData): Promise<Plan> {
    return Database.transaction(async trx => {
      if (data.default) {
        await Plan.query()
          .useTransaction(trx)
          .where('default', true)
          .where('system_id', authCtx.system.id)
          .update({ default: false });
      }

      return Plan.create(
        { id: v4(), ...data, system_id: authCtx.system.id },
        {
          client: trx,
        },
      );
    });
  }

  public async show(authCtx: AuthContext, id: string): Promise<Plan> {
    const plan = await Plan.query()
      .where('id', id)
      .where('system_id', authCtx.system.id)
      .first();

    if (!plan) {
      throw new ResourceNotFoundException(
        'Plano não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return plan;
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IPlanData,
  ): Promise<Plan> {
    const plan = await this.show(authCtx, id);

    if (data.default) {
      await Plan.query().where('default', true).update({ default: false });
    }

    return plan.merge(data).save();
  }

  public async remove(authCtx: AuthContext, id: string): Promise<void> {
    const plan = await this.show(authCtx, id);

    await plan.softDelete();
  }
}
