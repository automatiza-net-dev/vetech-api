import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Race from 'App/Models/Race';
import SharedService from 'App/Services/SharedService';
import IRaceData from 'Contracts/interfaces/IRaceData';
import { v4 } from 'uuid';

@inject()
export default class RaceService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(unitId: string): Promise<Array<Race>> {
    const group = await this.sharedService.getUserGroup(unitId);
    const species = await group.related('species').query();

    return Race.query().whereIn(
      'specie_id',
      species.map(s => s.id),
    );
  }

  async store(unitId: string, payload: IRaceData): Promise<Race> {
    const group = await this.sharedService.getUserGroup(unitId);
    const specie = await group
      .related('species')
      .query()
      .where('id', payload.specie_id)
      .first();

    if (!specie) {
      throw new ResourceNotFoundException(
        'Espécie não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return specie.related('races').create({
      id: v4(),
      description: payload.description,
    });
  }
}
