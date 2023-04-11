import { inject } from '@adonisjs/fold';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';
import { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  description?: string;
}

@inject()
export default class PatientAnimalHairService {
  async index(authCtx: AuthContext, data: ISearch) {
    const qb = PatientAnimalHair.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id);

    if (data.description) {
      qb.whereILike('description', `%${data.description}%`);
    }

    return qb;
  }
}
