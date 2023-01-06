import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import UserUnitRole from 'App/Models/UserUnitRole';
import SharedService from 'App/Services/SharedService';
import IUpdateUserRole from 'Contracts/interfaces/IUpdateUserRole';

interface ISearchBusinessUnitUsers {
  name?: string;
  document?: string;
  phone?: string;
  role?: string;
}

@inject()
export default class UserRoleService {
  constructor(private readonly sharedService: SharedService) {}

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
    const group = await this.sharedService.getUserGroup(id);
    await group.load('businessUnits');

    const entities = await UserUnitRole.query()
      .whereIn(
        'unit_id',
        group.businessUnits.map(bu => bu.id),
      )
      .whereHas('user', subquery => {
        if (data.name) {
          subquery.whereILike('name', `%${data.name}%`);
        }

        if (data.document) {
          subquery.whereILike('document', `%${data.document}%`);
        }

        if (data.phone) {
          subquery.whereILike('phone', `%${data.phone}%`);
        }
      })
      .whereHas('role', subquery => {
        if (data.role) {
          subquery.whereILike('name', `%${data.role}%`);
        }
      })
      .preload('unit')
      .preload('user')
      .preload('role');

    const uniqueUsers = Array.from(
      new Set(entities.map(entity => entity.user)),
    );

    return uniqueUsers.map(ent => {
      return {
        ...ent.toJSON(),
        roles: entities
          .filter(f => f.user.id === ent.id)
          .map(f => ({
            id: f.role.id,
            name: f.role.name,
            active: f.active,
            unit: {
              id: f.unit.id,
              name: f.unit.companyName ?? '-',
            },
          })),
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

  public async updateUserRoles(unitId: string, data: Array<IUpdateUserRole>) {
    const unit = await BusinessUnit.findOrFail(unitId);
    const group = await EconomicGroup.query()
      .where('id', unit.economicGroupId)
      .preload('businessUnits')
      .firstOrFail();

    const allValid = group.businessUnits.some(
      bu => !data.some(d => d.unit_id === bu.id),
    );
    if (!allValid) {
      throw new BadRequestException(
        'Unidade não pertence ao grupo',
        400,
        'E_BAD_REQUEST',
      );
    }

    return Database.transaction(async trx => {
      // eslint-disable-next-line no-restricted-syntax
      for await (const entity of data) {
        const userUnitRole = await UserUnitRole.query()
          .where('unit_id', unitId)
          .andWhere('user_id', entity.user_id)
          .first();

        if (!userUnitRole) {
          // create
          await UserUnitRole.create(
            {
              user_id: entity.user_id,
              role_id: entity.role_id,
              unit_id: unitId,
              active: entity.active,
            },
            {
              client: trx,
            },
          );
        } else {
          await userUnitRole
            .useTransaction(trx)
            .merge({ active: entity.active })
            .save();
        }
      }
    });
  }
}
