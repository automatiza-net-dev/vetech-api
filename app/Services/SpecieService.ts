import { inject } from '@adonisjs/fold';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Specie from 'App/Models/Specie';
import ISpecieData from 'Contracts/interfaces/ISpecieData';

@inject()
export default class SpecieService {
  async store(unitId: string, payload: ISpecieData): Promise<Specie> {
    const group = await this.getUserGroup(unitId);

    return group.related('species').create({
      description: payload.description,
    });
  }

  // TODO refactor - move to shared service
  private async getUserGroup(unitId: string): Promise<EconomicGroup> {
    const unit = await BusinessUnit.findOrFail(unitId);
    return unit.related('economicGroup').query().firstOrFail();
  }
}
