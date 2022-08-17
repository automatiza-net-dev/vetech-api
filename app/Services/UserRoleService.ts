import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import UserUnitRole from 'App/Models/UserUnitRole';

interface ISearchBusinessUnitUsers {
  name?: string;
  document?: string;
  phone?: string;
  role?: string;
}

@inject()
export default class UserRoleService {
  public async assignUnitRoleToUser(
    unit: BusinessUnit,
    role: Role,
    user: User,
  ): Promise<void> {
    const existingAssignedRole = await UserUnitRole.query()
      .where('user_id', user.id)
      .where('unit_id', unit.id)
      .where('role_id', role.id)
      .first();

    if (existingAssignedRole) {
      throw new BadRequestException('Cargo já existente', 400, 'E_BAD_REQUEST');
    }

    await UserUnitRole.create({
      user_id: user.id,
      role_id: role.id,
      unit_id: unit.id,
    });
  }

  public async getUnitUsers(id: string, data: ISearchBusinessUnitUsers) {
    const entities = await UserUnitRole.query()
      .where('unit_id', id)
      .whereHas('user', subquery => {
        subquery.whereILike('name', `%${data.name ?? ''}%`);

        if (data.document) {
          subquery.whereILike('document', `%${data.document}%`);
        }

        if (data.phone) {
          subquery.whereILike('phone', `%${data.phone}%`);
        }
      })
      .whereHas('role', subquery => {
        subquery.whereILike('name', `%${data.role ?? ''}%`);
      })
      .preload('user')
      .preload('role');

    const uniqueUsers = Array.from(
      new Set(entities.map(entity => entity.user)),
    );

    return uniqueUsers.map(ent => {
      return {
        ...ent.toJSON(),
        roles: entities.filter(f => f.user.id === ent.id).map(f => f.role.name),
      };
    });
  }

  public async deleteUserFromBusiness(unit: string, user: string) {
    const entities = await UserUnitRole.query()
      .where('unit_id', unit)
      .andWhere('user_id', user);

    const trx = await Database.transaction();

    try {
      // eslint-disable-next-line no-restricted-syntax
      for await (const entity of entities) {
        await entity.useTransaction(trx).delete();
      }

      await trx.commit();
    } catch (error) {
      Logger.error(error.message);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro ao executar operação',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }
}
