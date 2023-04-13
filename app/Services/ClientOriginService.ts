import { inject } from '@adonisjs/fold';
import ClientOrigin from 'App/Models/ClientOrigin';
import SharedService from 'App/Services/SharedService';
import IClientOriginData from 'Contracts/interfaces/IClientOriginData';

interface ISearch {
  type?: string;
  description?: string;
  active?: string;
}

@inject()
export default class ClientOriginService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, search: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const query = ClientOrigin.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null) and deleted_at is null',
      [group.id],
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

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const client = await ClientOrigin.query().where('id', id).first();

    if (!client) {
      throw this.sharedService.ResourceNotFound();
    }

    if (client.economic_group_id && client.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return client;
  }

  public async store(unitId: string, data: Omit<IClientOriginData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);

    const client = await ClientOrigin.create({
      ...data,
      economic_group_id: group.id,
    });

    return client;
  }

  public async update(unitId: string, id: string, data: IClientOriginData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const entity = await ClientOrigin.query().where('id', id).first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    if (entity.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return entity.merge(data).save();
  }

  public async destroy(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const entity = await ClientOrigin.query().where('id', id).first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    if (entity.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    await entity.softDelete();
  }
}
