import { inject } from '@adonisjs/fold';
import TaxationGroup from 'App/Models/TaxationGroup';
import SharedService from 'App/Services/SharedService';
import ITaxationGroupData from 'Contracts/interfaces/ITaxationGroupData';

interface ISearch {
  name?: string;
  active?: string;
}

@inject()
export default class TaxationGroupService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = TaxationGroup.query()
      .preload('rules')
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ]);

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }

  public async store(unitId: string, data: Omit<ITaxationGroupData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);

    return TaxationGroup.create({
      name: data.name,
      economic_group_id: group.id,
    });
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await TaxationGroup.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ])
      .where('id', id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound(
        'Grupo de tributação não encontrado',
      );
    }

    return ent;
  }

  public async update(unitId: string, id: string, data: ITaxationGroupData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await TaxationGroup.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound(
        'Grupo de tributação não encontrado',
      );
    }

    ent.merge(data);
    await ent.save();

    return ent;
  }

  public async destroy(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await TaxationGroup.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound(
        'Grupo de tributação não encontrado',
      );
    }

    await ent.softDelete();
  }
}
