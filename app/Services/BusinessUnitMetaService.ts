import { inject } from '@adonisjs/fold';
import BusinessUnitMeta, {
  TMetaType,
  TValueMetaType,
} from 'App/Models/BusinessUnitMeta';
import SharedService, { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  units?: string[];
  groups?: string[];
  type?: string;
}

@inject()
export default class BusinessUnitMetaService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = BusinessUnitMeta.query().preload('unit', query => {
      query.select('id', 'identification');
    });

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_unit_id', data.units);
    } else {
      qb.where('business_unit_id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups)) {
      qb.whereHas('unit', query => {
        query.whereIn('economic_group_id', data.groups ?? []);
      });
    }

    if (data.type) {
      qb.where('type', data.type as TMetaType);
    }

    return qb;
  }

  async store(
    authCtx: AuthContext,
    data: {
      type: TMetaType;
      value: number;
      valueType: TValueMetaType;
      period: string;
    },
  ) {
    return BusinessUnitMeta.create({
      business_unit_id: authCtx.unit.id,
      type: data.type,
      value: data.value,
      valueType: data.valueType,
      period: data.period,
    });
  }

  async show(authCtx: AuthContext, id: string) {
    const model = await BusinessUnitMeta.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('id', id)
      .preload('unit', query => {
        query.select('id', 'identification');
      })
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model;
  }

  async update(
    authCtx: AuthContext,
    id: string,
    data: {
      type: TMetaType;
      value: number;
      valueType: TValueMetaType;
      period: string;
      active: boolean;
    },
  ) {
    const model = await this.show(authCtx, id);

    return model
      .merge({
        type: data.type,
        value: data.value,
        valueType: data.valueType,
        period: data.period,
        active: data.active,
      })
      .save();
  }

  async destroy(authCtx: AuthContext, id: string) {
    const model = await this.show(authCtx, id);

    await model.delete();
  }
}
