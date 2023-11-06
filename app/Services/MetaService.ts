import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Meta from 'App/Models/Meta';
import SharedService, { AuthContext } from 'App/Services/SharedService';

interface ISearch {
  description?: string;
}

@inject()
export default class MetaService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = Meta.query()
      .preload('group', query => {
        query.select('id', 'company_name');
      })
      .where('system_id', authCtx.system.id)
      .where('economic_group_id', authCtx.group.id);

    if (data.description) {
      qb.whereILike('description', `%${data.description}%`);
    }

    return qb;
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
