import { inject } from '@adonisjs/fold';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import SharedService from 'App/Services/SharedService';
import IOccurrenceData from 'Contracts/interfaces/IOccurrenceData';

interface ISearch {
  description?: string;
  type?: OccurrenceType;
}

@inject()
export default class OccurrenceService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Occurrence.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Occurrence.query().where('id', id);

    const ent = await qb.first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    if (ent?.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async store(unitId: string, data: Omit<IOccurrenceData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Occurrence.create({
      description: data.description,
      type: data.type,
      economic_group_id: group.id,
    });
  }

  public async update(unitId: string, id: string, data: IOccurrenceData) {
    const ent = await this.show(unitId, id);

    return ent
      .merge({
        description: data.description,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const ent = await this.show(unitId, id);

    await ent.softDelete();
  }
}
