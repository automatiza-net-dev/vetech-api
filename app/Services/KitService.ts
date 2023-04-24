import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BusinessUnit from 'App/Models/BusinessUnit';
import Kit from 'App/Models/Kit';
import SharedService from 'App/Services/SharedService';
import IKitData from 'Contracts/interfaces/IKitData';

interface ISearch {
  description?: string;
}

@inject()
export default class KitService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const qb = Kit.query().where('business_unit_id', unitId);

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async store(unitId: string, data: Omit<IKitData, 'active'>) {
    return Database.transaction(async trx => {
      const unit = await BusinessUnit.findOrFail(unitId, {
        client: trx,
      });

      return Kit.create({
        description: data.description,
        fromExpiration: data.fromExpiration,
        toExpiration: data.toExpiration,
        business_unit_id: unit.id,
        economic_group_id: unit.economicGroupId,
      });
    });
  }

  public async show(unitId: string, id: string) {
    const ent = await Kit.query()
      .where('id', id)
      .andWhere('business_unit_id', unitId)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(unitId: string, id: string, data: IKitData) {
    const entity = await this.show(unitId, id);

    return entity
      .merge({
        description: data.description,
        fromExpiration: data.fromExpiration,
        toExpiration: data.toExpiration,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    return entity.delete();
  }
}
