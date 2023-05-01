import { inject } from '@adonisjs/fold';
import Unit, { UnitType } from 'App/Models/Unit';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IUnitData from 'Contracts/interfaces/IUnitData';

interface ISearch {
  type?: UnitType;
}

@inject()
export default class UnitService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = Unit.query()
      .where('system_id', authCtx.system.id)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ]);

    if (data.type) {
      qb.whereILike('type', `%${data.type}%`);
    }

    return qb;
  }

  public async store(
    authCtx: AuthContext,

    data: Omit<IUnitData, 'active'>,
  ) {
    return Unit.create({
      name: data.name,
      economic_group_id: authCtx.group.id,
      system_id: authCtx.system.id,
      tag: data.tag,
      type: data.type,
    });
  }

  public async show(authCtx: AuthContext, id: string) {
    const unit = await Unit.query()
      .where('system_id', authCtx.system.id)
      .where('id', id)
      .first();

    if (!unit) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!unit.economic_group_id) {
      return unit;
    }

    if (unit.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return unit;
  }

  public async update(authCtx: AuthContext, id: string, data: IUnitData) {
    const entity = await this.show(authCtx, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return entity
      .merge({
        name: data.name,
        tag: data.tag,
        type: data.type,
        active: data.active,
      })
      .save();
  }

  public async destroy(authCtx: AuthContext, id: string) {
    const entity = await this.show(authCtx, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await entity.softDelete();
  }
}
