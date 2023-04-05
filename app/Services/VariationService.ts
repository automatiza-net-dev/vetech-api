import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Variation from 'App/Models/Variation';
import SharedService from 'App/Services/SharedService';
import IVariationData from 'Contracts/interfaces/IVariationData';

interface ISearch {
  description?: string;
}

@inject()
export default class VariationService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch): Promise<Array<Variation>> {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Variation.query()
      .where('economic_group_id', group.id)
      .preload('options');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string): Promise<Variation> {
    const group = await this.sharedService.getUserGroup(unitId);

    const variation = await group
      .related('variations')
      .query()
      .where('id', id)
      .preload('options')
      .first();

    if (!variation) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return variation;
  }

  public async store(
    unitId: string,
    data: Omit<IVariationData, 'active'>,
  ): Promise<Variation> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('variations').create({
      description: data.description,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IVariationData,
  ): Promise<Variation> {
    const variation = await this.show(unitId, id);

    return variation
      .merge({
        description: data.description,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const variation = await this.show(unitId, id);

    await variation.softDelete();
  }
}
