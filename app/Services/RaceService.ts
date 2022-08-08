import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Race from 'App/Models/Race';
import SharedService from 'App/Services/SharedService';
import IRaceData from 'Contracts/interfaces/IRaceData';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
  code?: string;
}

@inject()
export default class RaceService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(unitId: string, data: ISearch): Promise<Array<Race>> {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Race.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ])
      .whereNull('deleted_at')
      .preload('specie');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.code) {
      qb.where('code', 'ilike', `%${data.code}%`);
    }

    return qb;
  }

  async show(unitId: string, id: string): Promise<Race> {
    const group = await this.sharedService.getUserGroup(unitId);

    const race = await Race.find(id);

    if (
      !race ||
      (!!race.economic_group_id && race.economic_group_id !== group.id)
    ) {
      throw new ResourceNotFoundException(
        'Raça não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    await race.load('specie');

    return race;
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
      economic_group_id: group.id,
    });
  }

  async update(unitId: string, id: string, payload: IRaceData): Promise<Race> {
    const race = await this.show(unitId, id);

    return race.merge(payload).save();
  }

  async destroy(unitId: string, id: string): Promise<void> {
    const race = await this.show(unitId, id);

    await race.softDelete();
  }
}
