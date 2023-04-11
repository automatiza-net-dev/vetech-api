import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Specie from 'App/Models/Specie';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import ISpecieData from 'Contracts/interfaces/ISpecieData';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
}

@inject()
export default class SpecieService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = Specie.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id)
      .whereNull('deleted_at');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return (await qb).map(elem => ({
      id: elem.id,
      description: elem.description,
      createdAt: elem.createdAt,
    }));
  }

  async show(authCtx: AuthContext, id: string): Promise<Specie> {
    const specie = await Specie.query()
      .where('id', id)
      .where('system_id', authCtx.system.id)
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

  async store(authCtx: AuthContext, payload: ISpecieData): Promise<Specie> {
    return authCtx.group.related('species').create({
      id: v4(),
      description: payload.description,
      system_id: authCtx.system.id,
    });
  }

  async update(
    authCtx: AuthContext,
    id: string,
    payload: ISpecieData,
  ): Promise<Specie> {
    const specie = await this.show(authCtx, id);

    if (
      specie.economic_group_id &&
      specie.economic_group_id !== authCtx.group.id
    ) {
      throw this.sharedService.SystemResource();
    }

    return specie.merge(payload).save();
  }

  async destroy(authCtx: AuthContext, id: string): Promise<void> {
    const specie = await this.show(authCtx, id);

    if (
      specie.economic_group_id &&
      specie.economic_group_id !== authCtx.group.id
    ) {
      throw this.sharedService.SystemResource();
    }

    await specie.softDelete();
  }
}
