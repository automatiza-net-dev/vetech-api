import { inject } from '@adonisjs/fold';
import Unit, { UnitType } from 'App/Models/Unit';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IUnitData from 'Contracts/interfaces/IUnitData';

interface ISearch {
  type?: UnitType;
}

@inject()
export default class UnitService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, user: User, data: ISearch) {
    const isSudo = await this.sharedService.isSuperAdmin(user);
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Unit.query();

    if (!isSudo) {
      qb.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ]);
    }

    if (data.type) {
      qb.whereILike('type', `%${data.type}%`);
    }

    return qb;
  }

  public async store(
    unitId: string,
    user: User,
    data: Omit<IUnitData, 'active'>,
  ) {
    const isSudo = await this.sharedService.isSuperAdmin(user);
    const group = await this.sharedService.getUserGroup(unitId);

    return Unit.create({
      name: data.name,
      economic_group_id: isSudo ? null : group.id,
      tag: data.tag,
      type: data.type,
    });
  }

  public async show(unitId: string, user: User, id: string) {
    const isSudo = await this.sharedService.isSuperAdmin(user);
    const group = await this.sharedService.getUserGroup(unitId);
    const unit = await Unit.find(id);

    if (!unit) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!isSudo && unit.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return unit;
  }

  public async update(unitId: string, user: User, id: string, data: IUnitData) {
    const entity = await this.show(unitId, user, id);

    return entity
      .merge({
        name: data.name,
        tag: data.tag,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, user: User, id: string) {
    const entity = await this.show(unitId, user, id);

    await entity.softDelete();
  }
}
