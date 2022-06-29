import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Specie from 'App/Models/Specie';
import ISpecieData from 'Contracts/interfaces/ISpecieData';

@inject()
export default class SpecieService {
  async index(unitId: string): Promise<Array<Specie>> {
    const group = await this.getUserGroup(unitId);

    return group.related('species').query();
  }

  async show(unitId: string, id: string): Promise<Specie> {
    const group = await this.getUserGroup(unitId);

    const specie = await group
      .related('species')
      .query()
      .where('id', id)
      .first();

    if (!specie) {
      throw new ResourceNotFoundException(
        'Espécie não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return specie;
  }

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
