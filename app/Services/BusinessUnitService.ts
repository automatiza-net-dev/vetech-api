import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { ICreateBusinessUnit } from 'Contracts/interfaces/ICreateBusinessUnit';
import { IUpdateUnitUser } from 'Contracts/interfaces/IUpdateUnitUser';
import { IUpdateBusinessUnit } from 'Contracts/interfaces/UpdateBusinessUnit';
import { v4 } from 'uuid';

interface ISearchBusinessUnit {
  identification?: string;
  email?: string;
}

@inject()
export default class BusinessUnitService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(data: ISearchBusinessUnit): Promise<Array<BusinessUnit>> {
    const qb = BusinessUnit.query().preload('economicGroup');

    if (data.identification) {
      qb.where('identification', 'ilike', `%${data.identification}%`);
    }

    if (data.email) {
      qb.where('email', 'ilike', `%${data.email}%`);
    }

    return qb;
  }

  public async store(
    user: User,
    data: ICreateBusinessUnit,
  ): Promise<BusinessUnit> {
    const economicGroups = await user.related('economicGroups').query();
    const economicGroup = economicGroups.find(
      eg => eg.id === data.economic_group_id,
    );

    if (!economicGroup) {
      throw new BadRequestException('Grupo econômico inválido');
    }

    return economicGroup.related('businessUnits').create({
      id: v4(),
      ...data,
    });
  }

  public async show(id: string): Promise<BusinessUnit> {
    const unit = await BusinessUnit.find(id);

    if (!unit) {
      throw new ResourceNotFoundException(
        'A unidade não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return unit;
  }

  public async update(
    id: string,
    data: IUpdateBusinessUnit,
  ): Promise<BusinessUnit> {
    const unit = await this.show(id);

    return unit.merge(data).save();
  }

  public async updateUser(
    unitId: string,
    loggedUser: User,
    id: string,
    data: IUpdateUnitUser,
  ) {
    if (!(await this.sharedService.userHasRoles(loggedUser, ['admin']))) {
      throw new BadRequestException(
        'Apenas administradores podem alterar usuários',
      );
    }

    const user = await User.find(id);

    if (!user) {
      throw new ResourceNotFoundException(
        'Usuário não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await User.findBy('email', data.email);
      if (existingUser) {
        throw new BadRequestException('E-mail já cadastrado');
      }
    }

    const { roles, ...sanitized } = data;

    if (roles?.length === 0) {
      throw new BadRequestException(
        'Não selecionar cargos vai desativar o usuário',
      );
    }

    Object.assign(user, sanitized);

    await user.load('roles', query => {
      query.where('unit_id', unitId);
      query.preload('role');
    });

    await Database.transaction(async trx => {
      await user.merge(sanitized).useTransaction(trx).save();

      await user.related('roles').query().delete().useTransaction(trx);

      // eslint-disable-next-line no-restricted-syntax
      for await (const role of roles ?? []) {
        await user.related('roles').create(
          {
            role_id: role,
            unit_id: unitId,
          },
          {
            client: trx,
          },
        );
      }
    });

    return user;
  }

  public async getUserBusinessUnits(user: User): Promise<Array<BusinessUnit>> {
    const entities = await user
      .related('economicGroups')
      .query()
      .preload('businessUnits');

    return entities.map(ent => ent.businessUnits).flat();
  }

  async searchUser(unitId: string, id: string) {
    const user = await User.find(id);

    if (!user) {
      throw new ResourceNotFoundException(
        'Usuário não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    await user.load('roles', q => {
      q.where('unit_id', unitId);
      q.preload('role');
    });

    if (user.roles.length === 0) {
      throw new BadRequestException('Você não tem permissão para acessar');
    }

    return {
      ...user.toJSON(),
      roles: user.roles.map(f => f.role.name),
    };
  }
}
