import { inject } from '@adonisjs/fold';
import ClientOrigin from 'App/Models/ClientOrigin';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IClientOriginData from 'Contracts/interfaces/IClientOriginData';

interface ISearch {
  type?: string;
  description?: string;
  active?: string;
}

@inject()
export default class ClientOriginService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(authCtx: AuthContext, search: ISearch) {
    const query = ClientOrigin.query()
      .where('system_id', authCtx.system.id)
      .whereRaw(
        '(economic_group_id = ? or economic_group_id is null) and deleted_at is null',
        [authCtx.group.id],
      );

    if (search.type) {
      query.where('type', search.type);
    }

    if (search.description) {
      query.where('description', 'like', `%${search.description}%`);
    }

    if (search.active) {
      query.where('active', search.active);
    }

    return query;
  }

  public async show(authCtx: AuthContext, id: string) {
    const client = await ClientOrigin.query()
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .first();

    if (!client) {
      throw this.sharedService.ResourceNotFound();
    }

    if (
      client.economic_group_id &&
      client.economic_group_id !== authCtx.group.id
    ) {
      throw this.sharedService.ResourceNotFound();
    }

    return client;
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IClientOriginData, 'active'>,
  ) {
    const client = await ClientOrigin.create({
      ...data,
      economic_group_id: authCtx.group.id,
    });

    return client;
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IClientOriginData,
  ) {
    const entity = await ClientOrigin.query()
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    if (entity.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return entity.merge(data).save();
  }

  public async destroy(authCtx: AuthContext, id: string) {
    const entity = await ClientOrigin.query()
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    if (entity.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    await entity.softDelete();
  }
}
