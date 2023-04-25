import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Pathology from 'App/Models/Pathology';
import { PATHOLOGY_UUID } from 'App/Models/TimelineType';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IPathologyData from 'Contracts/interfaces/IPathologyData';

interface ISearch {
  description?: string;
}

@inject()
export default class PathologyService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = Pathology.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .preload('timelineType')
      .preload('group');

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: string) {
    // const group = await this.sharedService.getUserGroup(unitId);
    const entity = await Pathology.query()
      .preload('timelineType')
      .preload('group')
      .where('id', id)
      .where('system_id', authCtx.system.id)
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

  public async store(
    authCtx: AuthContext,
    data: Omit<IPathologyData, 'active'>,
  ) {
    return authCtx.group.related('pathologies').create({
      description: data.description,
      definition: data.definition,
      template: data.template,
      timeline_type_id: PATHOLOGY_UUID,
    });
  }

  public async update(authCtx: AuthContext, id: string, data: IPathologyData) {
    const entity = await this.show(authCtx, id);

    if (
      entity.economic_group_id &&
      entity.economic_group_id !== authCtx.group.id
    ) {
      throw this.sharedService.SystemResource();
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

  public async destroy(authCtx: AuthContext, id: string) {
    const entity = await this.show(authCtx, id);

    if (
      entity.economic_group_id &&
      entity.economic_group_id !== authCtx.group.id
    ) {
      throw this.sharedService.SystemResource();
    }

    await entity.softDelete();
  }
}
