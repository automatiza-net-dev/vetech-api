import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Race from 'App/Models/Race';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IRaceData from 'Contracts/interfaces/IRaceData';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
  specie?: string;
  fur?: string;
}

@inject()
export default class RaceService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = Race.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id)
      .whereNull('deleted_at')
      .whereHas('specie', query => {
        query.whereILike('description', `%${data.specie ?? ''}%`);
      })
      .preload('specie');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.fur) {
      qb.where('fur', 'ilike', data.fur);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      description: elem.description,
      specie: {
        id: elem.specie.id,
        description: elem.specie.description,
      },
      fur: elem.fur,
      createdAt: elem.createdAt,
    }));
  }

  async show(authCtx: AuthContext, id: string): Promise<Race> {
    const race = await Race.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .preload('specie')
      .first();

    if (!race) {
      throw new ResourceNotFoundException(
        'Raça não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return race;
  }

  async store(authCtx: AuthContext, payload: IRaceData): Promise<Race> {
    const specie = await authCtx.group
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
      economic_group_id: authCtx.group.id,
      fur: payload.fur,
      system_id: authCtx.system.id,
    });
  }

  async update(
    authCtx: AuthContext,
    id: string,
    payload: IRaceData,
  ): Promise<Race> {
    const race = await this.show(authCtx, id);

    if (race.economic_group_id && race.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.SystemResource();
    }

    return race.merge(payload).save();
  }

  async destroy(authCtx: AuthContext, id: string): Promise<void> {
    const race = await this.show(authCtx, id);

    if (race.economic_group_id && race.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.SystemResource();
    }

    await race.softDelete();
  }
}
