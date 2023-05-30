import { inject } from '@adonisjs/fold';
import Activity from 'App/Models/Activity';
import SharedService, { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  description?: string;
  active?: string;
}

@inject()
export default class ActivityService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(_authCtx: AuthContext, data: ISearch) {
    const qb = Activity.query().where('type', 'crm');

    if (data.description) {
      qb.whereILike('description', `%${data.description}`);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }

  public async show(_authCtx: AuthContext, id: string) {
    const model = await Activity.query().where('id', id).first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model;
  }

  public async store(
    _authCtx: AuthContext,
    data: { description: string; duration: number; type: string },
  ) {
    await Activity.create({
      description: data.description,
      type: data.type,
      duration: data.duration,
    });
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: {
      description: string;
      duration: number;
      type: string;
      active: boolean;
    },
  ) {
    const model = await this.show(authCtx, id);

    await model
      .merge({
        description: data.description,
        type: data.type,
        duration: data.duration,
        active: data.active,
      })
      .save();
  }

  public async delete(authCtx: AuthContext, id: string) {
    const model = await this.show(authCtx, id);

    await model.delete();
  }
}
