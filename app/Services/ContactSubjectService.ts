import { inject } from '@adonisjs/fold';
import ContactSubject from 'App/Models/ContactSubject';
import SharedService, { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  description?: string;
  active?: string;
}

@inject()
export default class ContactSubjectService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = ContactSubject.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('type', 'crm');

    if (data.description) {
      qb.whereILike('description', `%${data.description}`);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: string) {
    const model = await ContactSubject.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model;
  }

  public async store(
    authCtx: AuthContext,
    data: { description: string; type: string },
  ) {
    await ContactSubject.create({
      system_id: authCtx.system.id,
      economic_group_id: authCtx.group.id,

      description: data.description,
      type: data.type,
    });
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: {
      description: string;
      type: string;
      active: boolean;
    },
  ) {
    const model = await this.show(authCtx, id);

    await model
      .merge({
        description: data.description,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async delete(authCtx: AuthContext, id: string) {
    const model = await this.show(authCtx, id);

    await model.delete();
  }
}
