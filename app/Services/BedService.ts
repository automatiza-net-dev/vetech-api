import { inject } from '@adonisjs/fold';
import Bed, { BedType } from 'App/Models/Bed';
import SharedService from 'App/Services/SharedService';
import IBedData from 'Contracts/interfaces/IBedData';

interface ISearch {
  name?: string;
  type?: BedType;
  active?: string;
}

@inject()
export default class BedService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const qb = Bed.query().where('business_id', unitId);

    if (data.name) {
      qb.where('name', 'like', `%${data.name}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }

  public async store(unitId: string, data: Omit<IBedData, 'active'>) {
    return Bed.create({
      name: data.name,
      tag: data.tag,
      type: data.type,
      business_id: unitId,
    });
  }

  public async show(unitId: string, id: string) {
    const ent = await Bed.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    if (ent.business_id && ent.business_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(unitId: string, id: string, data: IBedData) {
    const entity = await this.show(unitId, id);

    return entity
      .merge({
        name: data.name,
        tag: data.tag,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    return entity.delete();
  }
}
