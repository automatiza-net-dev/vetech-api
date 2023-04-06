import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Pathology from 'App/Models/Pathology';
import { PATHOLOGY_UUID } from 'App/Models/TimelineType';
import SharedService from 'App/Services/SharedService';
import IPathologyData from 'Contracts/interfaces/IPathologyData';

interface ISearch {
  description?: string;
}

@inject()
export default class PathologyService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Pathology.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ])
      .preload('timelineType')
      .preload('group');

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    // const group = await this.sharedService.getUserGroup(unitId);
    const entity = await Pathology.query()
      .preload('timelineType')
      .preload('group')
      .where('id', id)
      .first();

    if (!entity) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return entity;
  }

  public async store(unitId: string, data: Omit<IPathologyData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('pathologies').create({
      description: data.description,
      definition: data.definition,
      template: data.template,
      timeline_type_id: PATHOLOGY_UUID,
    });
  }

  public async update(unitId: string, id: string, data: IPathologyData) {
    const entity = await this.show(unitId, id);

    if (entity.economic_group_id) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return entity
      .merge({
        description: data.description,
        definition: data.definition,
        active: data.active,
        template: data.template,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    if (entity.economic_group_id) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    await entity.softDelete();
  }
}
