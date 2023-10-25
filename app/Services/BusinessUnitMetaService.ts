import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnitMeta from 'App/Models/BusinessUnitMeta';
import SharedService, { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  units?: string[];
  groups?: string[];
}

@inject()
export default class BusinessUnitMetaService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = BusinessUnitMeta.query()
      .preload('meta', query => {
        query.select('id', 'description', 'type', 'active');
      })
      .preload('unit', query => {
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

    return qb;
  }

  async store(
    _: AuthContext,
    data: {
      metaId: number;
      businessUnitId: string;
      value: number;
      period: string;
    },
  ) {
    return await Database.transaction(async trx => {
      const existing = await BusinessUnitMeta.query()
        .useTransaction(trx)
        .where('business_unit_id', data.businessUnitId)
        .where('meta_id', data.metaId)
        .where('period', data.period);

      if (existing.length > 0) {
        throw new BadRequestException('Meta já cadastrada', 400, 'E_ERR');
      }

      return BusinessUnitMeta.create(
        {
          business_unit_id: data.businessUnitId,
          meta_id: data.metaId,
          value: data.value,
          period: data.period,
        },
        {
          client: trx,
        },
      );
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
      value: number;
    },
  ) {
    const model = await this.show(authCtx, id);

    return model
      .merge({
        value: data.value,
      })
      .save();
  }

  async destroy(authCtx: AuthContext, id: string) {
    const model = await this.show(authCtx, id);

    await model.delete();
  }
}
