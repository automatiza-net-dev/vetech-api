import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Permission from 'App/Models/Permission';
import Role from 'App/Models/Role';
import { AuthContext } from 'App/Services/SharedService';
import IPermissionData from 'Contracts/interfaces/PermissionData';
import { DateTime } from 'luxon';

interface ISearch {
  description?: string;
}

@inject()
export default class PermissionService {
  public async index(
    authCtx: AuthContext,
    data: ISearch,
  ): Promise<Array<Permission>> {
    const qb = Permission.query().whereHas('systems', query => {
      query.where('system_id', authCtx.system.id);
    });

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return qb;
  }

  public async store(
    authCtx: AuthContext,
    data: IPermissionData,
  ): Promise<Permission> {
    return Database.transaction(async trx => {
      const permission = await Permission.create(
        {
          control: data.control,
          description: data.description,
          control_id: data.controlId,
          screen_id: data.screenId,
        },
        {
          client: trx,
        },
      );

      await permission.related('systems').attach([authCtx.system.id], trx);

      return permission;
    });
  }

  public async fetchMenu(authCtx: AuthContext) {
    return Permission.query()
      .whereHas('systems', query => {
        query.where('system_id', authCtx.system.id);
      })
      .whereILike('control', `%${'menu'}%`)
      .preload('screen');
  }

  public async fetchScreens(authCtx: AuthContext, data: { term: string }) {
    return Permission.query()
      .whereHas('systems', query => {
        query.where('system_id', authCtx.system.id);
      })
      .whereHas('screen', query => {
        query.whereILike('name', `%${data.term}%`);
      })
      .preload('screen');
  }

  public async show(authCtx: AuthContext, id: number): Promise<Permission> {
    const permission = await Permission.query()
      .where('id', id)
      .whereHas('systems', query => {
        query.where('system_id', authCtx.system.id);
      })
      .first();

    if (!permission) {
      throw new ResourceNotFoundException(
        'Permissão não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return permission;
  }

  public async update(
    authCtx: AuthContext,
    id: number,
    data: IPermissionData,
  ): Promise<Permission> {
    const permission = await this.show(authCtx, id);
    return permission
      .merge({
        control: data.control,
        control_id: data.controlId,
        description: data.description,
        screen_id: data.screenId,
      })
      .save();
  }

  public async delete(authCtx: AuthContext, id: number): Promise<void> {
    const permission = await this.show(authCtx, id);

    await permission.softDelete();
  }

  async syncPermissions() {
    await Database.transaction(async trx => {
      const permissions = await Permission.query()
        .useTransaction(trx)
        .whereNull('updated_at')
        .preload('systems')
        .preload('roles');

      const syncTasks = permissions.map(async permission => {
        return permission
          .related('systems')
          .sync(permission.$systems, true, trx);
      });
      await Promise.all(syncTasks);

      // TODO same systems_permissions as above?

      // const map = new Map<string, number[]>();

      // const entriesTasks = permissions.map(async permission => {
      //   const rawData: {
      //     id: number;
      //     permission_id: number;
      //     system_id: number;
      //   }[] = await Database.from('systems_permissions')
      //     .where('permission_id', permission.id)
      //     .whereIn('system_id', permission.$systems);

      //   map.set(
      //     permission.id.toString(),
      //     rawData.map(item => item.id),
      //   );
      // });
      // await Promise.all(entriesTasks);

      // console.log(map);

      const roles = await Role.query().useTransaction(trx);
      const rolesTasks = roles.map(async role => {
        return role.related('permissions').sync(
          permissions
            .filter(p => p.$systems.includes(role.system_id))
            .map(p => p.id),
          true,
          trx,
        );
      });
      await Promise.all(rolesTasks);

      await Role.query()
        .useTransaction(trx)
        .whereIn(
          'id',
          roles.map(r => r.id),
        )
        .update({
          updated_at: DateTime.now(),
        });
    });
  }
}
