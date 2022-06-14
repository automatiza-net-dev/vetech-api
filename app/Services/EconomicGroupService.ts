import { inject } from '@adonisjs/fold';
import EconomicGroup from 'App/Models/EconomicGroup';

@inject()
export default class EconomicGroupService {
  public async index(): Promise<Array<EconomicGroup>> {
    return EconomicGroup.all();
  }
}
