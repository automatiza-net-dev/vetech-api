import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
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
    const qb = group.related('pathologies').query();

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);
    const entity = await group
      .related('pathologies')
      .query()
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
      timeline_type_id: PATHOLOGY_UUID,
    });
  }

  public async update(unitId: string, id: string, data: IPathologyData) {
    const entity = await this.show(unitId, id);

    return entity
      .merge({
        description: data.description,
        definition: data.definition,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    await entity.softDelete();
  }
}
