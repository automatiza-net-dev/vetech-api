import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Specie from 'App/Models/Specie';
import SharedService from 'App/Services/SharedService';
import ISpecieData from 'Contracts/interfaces/ISpecieData';
import { v4 } from 'uuid';

@inject()
export default class SpecieService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(unitId: string): Promise<Array<Specie>> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('species').query();
  }

  async show(unitId: string, id: string): Promise<Specie> {
    const group = await this.sharedService.getUserGroup(unitId);

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
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('species').create({
      id: v4(),
      description: payload.description,
    });
  }

  async update(
    unitId: string,
    id: string,
    payload: ISpecieData,
  ): Promise<Specie> {
    const specie = await this.show(unitId, id);

    return specie.merge(payload).save();
  }

  async destroy(unitId: string, id: string): Promise<void> {
    const specie = await this.show(unitId, id);

    await specie.softDelete();
  }
}
