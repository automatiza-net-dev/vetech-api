import { inject } from '@adonisjs/fold';
import Brand from 'App/Models/Brand';
import { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  description?: string;
}

@inject()
export default class BrandService {
  async index(authCtx: AuthContext, data: ISearch) {
    const qb = Brand.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ]);

    if (data.description) {
      qb.whereILike('description', `%${data.description}%`);
    }

    return qb;
  }
}
