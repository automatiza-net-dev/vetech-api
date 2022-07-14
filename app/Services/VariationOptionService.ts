import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import VariationOption from 'App/Models/VariationOption';
import SharedService from 'App/Services/SharedService';
import VariationService from 'App/Services/VariationService';
import IVariationOptionData from 'Contracts/interfaces/IVariationOptionData';

@inject()
export default class VariationOptionService {
  constructor(
    private readonly sharedService: SharedService,
    private readonly variationService: VariationService,
  ) {}

  public async index(unitId: string): Promise<Array<VariationOption>> {
    const group = await this.sharedService.getUserGroup(unitId);

    const variations = await group
      .related('variations')
      .query()
      .preload('options');

    return variations.map(v => v.options).flat();
  }

  public async show(unitId: string, id: string): Promise<VariationOption> {
    const group = await this.sharedService.getUserGroup(unitId);

    const variations = await group
      .related('variations')
      .query()
      .preload('options');

    const option = await VariationOption.query()
      .where('id', id)
      .andWhereIn(
        'variation_id',
        variations.map(v => v.id),
      )
      .first();

    if (!option) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return option;
  }

  public async store(
    unitId: string,
    data: Omit<IVariationOptionData, 'active'>,
  ): Promise<VariationOption> {
    const variation = await this.variationService.show(
      unitId,
      data.variationId,
    );

    return variation.related('options').create({
      description: data.description,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: Omit<IVariationOptionData, 'variationId'>,
  ): Promise<VariationOption> {
    const option = await this.show(unitId, id);

    return option
      .merge({
        description: data.description,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const option = await this.show(unitId, id);

    await option.delete();
  }
}
