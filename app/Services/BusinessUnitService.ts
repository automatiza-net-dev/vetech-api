import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import CheckingAccount, {
  CheckingAccountType,
} from 'App/Models/CheckingAccount';
import { LicenceType } from 'App/Models/Licence';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { IBusinessUnitAcquirerData } from 'Contracts/interfaces/IBusinessUnitAcquirerData';
import { ICreateBusinessUnit } from 'Contracts/interfaces/ICreateBusinessUnit';
import { IUpdateUnitUser } from 'Contracts/interfaces/IUpdateUnitUser';
import { IUpdateBusinessUnit } from 'Contracts/interfaces/UpdateBusinessUnit';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

interface ISearchBusinessUnit {
  identification?: string;
  email?: string;
}

interface ISearchClinic {
  identification?: string;
  document?: string;
  name?: string;
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

  public async store(user: User, data: ICreateBusinessUnit) {
    try {
      await Database.transaction(async trx => {
        const economicGroups = await user
          .related('economicGroups')
          .query()
          .useTransaction(trx);
        const economicGroup = economicGroups.find(
          eg => eg.id === data.economic_group_id,
        );

        if (!economicGroup) {
          throw new BadRequestException('Grupo econômico inválido');
        }

        if (!this.sharedService.validDocument(data.document)) {
          throw new BadRequestException(
            'Documento inválido',
            400,
            'E_INVALID_DOCUMENT',
          );
        }
        const hasUnitWithDocument = await economicGroup
          .related('businessUnits')
          .query()
          .useTransaction(trx)
          .where('document', data.document)
          .first();
        if (hasUnitWithDocument) {
          throw new BadRequestException(
            `Este Cnpj já existe neste Grupo Economico para a Clinica "${
              data.fantasyName ?? '-'
            }";`,
            400,
            'E_INVALID_DOCUMENT',
          );
        }

        const products = await economicGroup
          .related('products')
          .query()
          .useTransaction(trx)
          .preload('variations', query => {
            query.preload('businessUnitProducts');
          });

        const unit = await economicGroup.related('businessUnits').create(
          {
            ...data,
          },
          {
            client: trx,
          },
        );

        await unit.related('unitConfig').create({});

        await unit.related('licences').create(
          {
            id: v4(),
            expirationDate: addDays(new Date(), 1000),
            type: LicenceType.TRIAL,
            active: true,
          },
          {
            client: trx,
          },
        );

        // eslint-disable-next-line no-restricted-syntax
        for await (const product of products) {
          // eslint-disable-next-line no-restricted-syntax
          for await (const variation of product.variations) {
            const [unitPrice] = product.variations[0].businessUnitProducts;

            await variation.related('businessUnitProducts').create(
              {
                businness_unit_id: unit.id,
                stock: 0,
                price: unitPrice.price,
                costPrice: unitPrice.costPrice,
                maximumStock: unitPrice.maximumStock,
                minimumStock: unitPrice.minimumStock,
                maximumDiscountPercentage: unitPrice.maximumDiscountPercentage,
                maximumDiscountValue: unitPrice.maximumDiscountValue,
                profitMargin: unitPrice.profitMargin,
              },
              {
                client: trx,
              },
            );
          }
        }

        await CheckingAccount.create(
          {
            business_unit_id: unit.id,
            description: `Cofre - ${unit.identification ?? 'Não informado'}`,
            accountNumber: 'Cofre',
            bankCode: 'Cofre',
            bankName: 'Cofre',
            agency: '001',
            type: CheckingAccountType.CX,
            balance: 0,
            active: true,
          },
          {
            client: trx,
          },
        );
      });
    } catch (error) {
      Logger.error(error.message);

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async show(id: string): Promise<BusinessUnit> {
    const unit = await BusinessUnit.query()
      .where('id', id)
      .preload('economicGroup')
      .first();

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
    return Database.transaction(async trx => {
      const unit = await BusinessUnit.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('economicGroup')
        .first();

      if (!unit) {
        throw new ResourceNotFoundException(
          'A unidade não foi encontrada',
          404,
          'E_NOT_FOUND',
        );
      }

      if (data.document && data.document !== unit.document) {
        if (!this.sharedService.validDocument(data.document)) {
          throw new BadRequestException(
            'Documento inválido',
            400,
            'E_INVALID_DOCUMENT',
          );
        }
        const hasUnitWithDocument = await unit.economicGroup
          .related('businessUnits')
          .query()
          .useTransaction(trx)
          .where('document', data.document)
          .first();
        if (hasUnitWithDocument) {
          throw new BadRequestException(
            `Este Cnpj já existe neste Grupo Economico para a Clinica "${
              unit.fantasyName ?? '-'
            }";`,
            400,
            'E_INVALID_DOCUMENT',
          );
        }
      }

      return unit
        .merge({
          identification: data.identification,
          fantasyName: data.fantasyName,
          companyName: data.companyName,
          email: data.email,
          document: data.document,
          phone: data.phone,
          postalCode: data.postalCode,
          address: data.address,
          number: data.number,
          complement: data.complement,
          district: data.district,
          city: data.city,
          state: data.state,
          active: data.active,

          stateRegistration: data.stateRegistration,
          cityRegistration: data.cityRegistration,
          cnae: data.cnae,
          simple: data.simple,
          cityCode: data.cityCode,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async updateAcquirer(
    unitId: string,
    id: string,
    data: IBusinessUnitAcquirerData,
  ) {
    await Database.transaction(async trx => {
      const unit = await BusinessUnit.query()
        .where('id', unitId)
        .useTransaction(trx)
        .firstOrFail();

      const acquirer = await unit
        .related('acquirers')
        .query()
        .where('id', id)
        .first();

      if (!acquirer) {
        throw new ResourceNotFoundException(
          'Adquirente não encontrado',
          404,
          'ERR',
        );
      }

      await acquirer
        .merge({ document: data.document, active: data.active })
        .useTransaction(trx)
        .save();
    });
  }

  public async deleteAcquirer(unitId: string, id: string) {
    await Database.transaction(async trx => {
      const unit = await BusinessUnit.query()
        .where('id', unitId)
        .useTransaction(trx)
        .firstOrFail();

      const acquirer = await unit
        .related('acquirers')
        .query()
        .where('id', id)
        .first();

      if (!acquirer) {
        throw new ResourceNotFoundException(
          'Adquirente não encontrado',
          404,
          'ERR',
        );
      }

      await acquirer.softDelete();
    });
  }

  public async updateUser(
    unitId: string,
    _: User,
    id: string,
    data: IUpdateUnitUser,
  ) {
    // TODO enable later
    // if (!(await this.sharedService.userHasRoles(loggedUser, ['admin']))) {
    //   throw new BadRequestException(
    //     'Apenas administradores podem alterar usuários',
    //   );
    // }

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

      if ((roles ?? []).length > 0) {
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
      }
    });

    return user;
  }

  public async getUserBusinessUnits(user: User, data: ISearchClinic) {
    const qb = user
      .related('economicGroups')
      .query()
      .preload('businessUnits', query => {
        if (data.document) {
          query.where('document', 'ilike', `%${data.document}%`);
        }

        if (data.name) {
          query.orWhere('fantasyName', 'ilike', `%${data.name}%`);
          query.orWhere('companyName', 'ilike', `%${data.name}%`);
        }

        if (data.identification) {
          query.where('identification', 'ilike', `%${data.identification}%`);
        }
      });

    const entities = await qb;

    return entities
      .map(ent => ent.businessUnits)
      .flat()
      .map(elem => ({
        id: elem.id,
        identification: elem.identification,
        document: elem.document,
        fantasyName: elem.fantasyName,
        companyName: elem.companyName,
        phone: elem.phone,
      }));
  }

  async searchUser(_: string, id: string) {
    const user = await User.find(id);

    if (!user) {
      throw new ResourceNotFoundException(
        'Usuário não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    await user.load('roles', q => {
      q.preload('role');
      q.preload('unit');
    });

    return {
      ...user.toJSON(),
      roles: user.roles.map(f => ({
        id: f.role.id,
        name: f.role.name,
        active: f.active,
        unit: {
          id: f.unit.id,
          name: f.unit.companyName ?? '-',
        },
      })),
    };
  }
}
