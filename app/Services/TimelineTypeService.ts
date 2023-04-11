import { inject } from '@adonisjs/fold';
import TimelineType from 'App/Models/TimelineType';
import { AuthContext } from 'App/Services/SharedService';

@inject()
export default class TimelineTypeService {
  public async index(authCtx: AuthContext) {
    return TimelineType.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ]);
  }
}
