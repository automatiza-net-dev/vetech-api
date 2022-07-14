import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import VariationGroup from 'App/Models/VariationGroup';
import SharedService from 'App/Services/SharedService';
import IVariationGroupData from 'Contracts/interfaces/IVariationGroupData';

@inject()
export default class VariationGroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('variationGroups').query();
  }

  public async show(unitId: string, id: string): Promise<VariationGroup> {
    const group = await this.sharedService.getUserGroup(unitId);

    const variation = await group
      .related('variationGroups')
      .query()
      .where('id', id)
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
    data: Omit<IVariationGroupData, 'active'>,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('variationGroups').create({
      description: data.description,
    });
  }

  public async update(unitId: string, id: string, data: IVariationGroupData) {
    const group = await this.show(unitId, id);

    return group
      .merge({
        description: data.description,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const group = await this.show(unitId, id);

    await group.softDelete();
  }
}
