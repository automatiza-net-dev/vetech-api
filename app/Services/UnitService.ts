import { inject } from '@adonisjs/fold';
import Unit from 'App/Models/Unit';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IUnitData from 'Contracts/interfaces/IUnitData';

@inject()
export default class UnitService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, user: User) {
    const isSudo = await this.sharedService.isSuperAdmin(user);

    const qb = Unit.query();

    if (!isSudo) {
      qb.whereRaw('(business_id = ? or business_id = null)', [unitId]);
    }

    return qb;
  }

  public async store(
    unitId: string,
    user: User,
    data: Omit<IUnitData, 'active'>,
  ) {
    const isSudo = await this.sharedService.isSuperAdmin(user);

    return Unit.create({
      name: data.name,
      business_id: isSudo ? null : unitId,
    });
  }

  public async show(unitId: string, user: User, id: string) {
    const isSudo = await this.sharedService.isSuperAdmin(user);
    const unit = await Unit.find(id);

    if (!unit) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!isSudo && unit.business_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    return unit;
  }

  public async update(unitId: string, user: User, id: string, data: IUnitData) {
    const entity = await this.show(unitId, user, id);

    return entity
      .merge({
        name: data.name,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, user: User, id: string) {
    const entity = await this.show(unitId, user, id);

    await entity.softDelete();
  }
}
