import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Specie from 'App/Models/Specie';
import SharedService from 'App/Services/SharedService';
import ISpecieData from 'Contracts/interfaces/ISpecieData';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
}

@inject()
export default class SpecieService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Specie.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ])
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

  async show(_: string, id: string): Promise<Specie> {
    const specie = await Specie.find(id);

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
    const group = await this.sharedService.getUserGroup(unitId);
    const specie = await this.show(unitId, id);

    if (specie.economic_group_id && specie.economic_group_id !== group.id) {
      throw this.sharedService.SystemResource();
    }

    return specie.merge(payload).save();
  }

  async destroy(unitId: string, id: string): Promise<void> {
    const group = await this.sharedService.getUserGroup(unitId);
    const specie = await this.show(unitId, id);

    if (specie.economic_group_id && specie.economic_group_id !== group.id) {
      throw this.sharedService.SystemResource();
    }

    await specie.softDelete();
  }
}
