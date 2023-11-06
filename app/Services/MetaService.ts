import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Meta from 'App/Models/Meta';
import SharedService, { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  units?: string[];
  groups?: string[];
  period?: string;
}

@inject()
export default class MetaService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    if (!data.period) {
      throw new BadRequestException('Período não informado', 400, 'E_ERR');
    }

    const qb = Database.from('business_units')
      .select(
        Database.raw(`
          business_units.id                      as b_id,
          business_units.identification,
          metas.id                               as m_id,
          metas.description,
          business_unit_metas.id                 as bum_id,
          coalesce(business_unit_metas.value, 0) as valor_meta,
          business_unit_metas.period
          `),
      )
      .joinRaw(
        `join metas on (business_units.economic_group_id = metas.economic_group_id or metas.economic_group_id is null) and metas.deleted_at is null and metas.system_id = ?`,
        [authCtx.system.id],
      )
      .joinRaw(
        `left join business_unit_metas on metas.id = business_unit_metas.meta_id and
                                          business_units.id = business_unit_metas.business_unit_id and business_unit_metas.period = ? and business_unit_metas.active = true`,
        [data.period],
      )
      .orderByRaw(`business_units.id, metas.id, business_unit_metas.id`);

    if (data.units && Array.isArray(data.units) && data.units.length > 0) {
      qb.whereIn('business_units.id', data.units);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
      qb.whereIn('business_units.economic_group_id', data.groups);
    } else {
      qb.where('business_units.economic_group_id', authCtx.group.id);
    }

    const rows = await qb;

    const map: Map<
      string,
      {
        metaId: number;
        buMetaId: string;
      }[]
    > = new Map();

    for (const row of rows) {
      if (!map.has(row.b_id)) {
        map.set(row.b_id, []);
      }

      map.get(row.b_id)?.push({
        metaId: row.m_id,
        buMetaId: row.bum_id,
      });
    }

    return Array.from(map.entries()).map(([key, value]) => {
      const unitRows: any[] = [];
      for (const row of value) {
        const innerRows = rows.filter(
          r =>
            r.b_id === key &&
            r.m_id === row.metaId &&
            r.bum_id === row.buMetaId,
        );

        unitRows.push(...innerRows);
      }

      return {
        unit: {
          id: key,
          identification: unitRows[0].identification,
        },
        metas: unitRows.map(r => ({
          meta: {
            id: r.m_id,
            description: r.description,
          },
          businessUnitMeta: {
            id: r.bum_id,
          },
          value: r.valor_meta,
          period: r.period,
        })),
      };
    });
  }

  async store(
    authCtx: AuthContext,
    data: {
      description: string;
      type: string;
    },
  ) {
    await Database.transaction(async trx => {
      const existing = await Meta.query()
        .where('economic_group_id', authCtx.group.id)
        .where('system_id', authCtx.system.id)
        .whereRaw('lower(description) = lower(?)', [data.description]);

      if (existing.length > 0) {
        throw new BadRequestException('Meta já cadastrada', 400, 'E_ERR');
      }

      await Meta.create(
        {
          economic_group_id: authCtx.group.id,
          system_id: authCtx.system.id,

          description: data.description,
          type: data.type,
        },
        {
          client: trx,
        },
      );
    });
  }

  async update(
    authCtx: AuthContext,
    id: string,
    data: {
      description: string;
      type: string;
      active: boolean;
    },
  ) {
    await Database.transaction(async trx => {
      const model = await Meta.query()
        .useTransaction(trx)
        .where('system_id', authCtx.system.id)
        .where('economic_group_id', authCtx.group.id)
        .where('id', id)
        .first();

      if (!model) {
        throw this.sharedService.ResourceNotFound();
      }

      if (model.description !== data.description) {
        const existing = await Meta.query()
          .useTransaction(trx)
          .where('system_id', authCtx.system.id)
          .where('economic_group_id', authCtx.group.id)
          .whereRaw('lower(description) = lower(?)', [data.description]);

        if (existing.length > 0) {
          throw new BadRequestException('Meta já cadastrada', 400, 'E_ERR');
        }
      }

      return model
        .merge({
          description: data.description,
          type: data.type,
          active: data.active,
        })
        .useTransaction(trx)
        .save();
    });
  }

  async destroy(authCtx: AuthContext, id: string) {
    const model = await Meta.query()
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    await model.softDelete();
  }
}
