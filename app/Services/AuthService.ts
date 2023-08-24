import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import Hash from '@ioc:Adonis/Core/Hash';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import { LicenceType } from 'App/Models/Licence';
import System from 'App/Models/System';
import User from 'App/Models/User';
import ILoginData from 'Contracts/interfaces/ILoginData';
import { isAfter } from 'date-fns';
import IpAccessControlService from 'App/Services/IpAccessControlService';

@inject()
export default class AuthService {
  constructor(private readonly ipService: IpAccessControlService) {}

  public async getRoles(user: User, sID: number, isLogin: boolean) {
    if (!user.type) {
      throw new BadRequestException('Usuário sem tipo', 400, 'E_NO_TYPE');
    }

    const qb = user
      .related('roles')
      .query()
      .preload('role', query => {
        query.preload('permissions', query => {
          query.where('status', true);

          if (isLogin) {
            query.where('type', 'user');
          }
        });
      })
      .preload('unit', query => {
        query.whereHas('economicGroup', query => {
          query.where('system_id', sID);
        });

        query.where('active', true);
      })
      .whereHas('unit', query => {
        query.whereHas('economicGroup', query => {
          query.where('system_id', sID);
        });

        query.where('active', true);
      })
      .where('active', true);

    if (user.type === 'user') {
      qb.whereHas('role', query => {
        query.whereIn('type', ['user', 'both']);
      });
    }

    if (user.type === 'controller') {
      qb.whereHas('role', query => {
        query.whereIn('type', ['controller', 'both']);
      });
    }

    if (user.type === 'system') {
      qb.whereHas('role', query => {
        query.whereIn('type', ['system']);
      });
    }

    return await qb;
  }

  public async login(data: ILoginData, auth: AuthContract, reqIp?: string) {
    return Database.transaction(async trx => {
      const system = await System.query()
        .useTransaction(trx)
        .where('name', data.system)
        .firstOrFail();

      const user = await User.query()
        .useTransaction(trx)
        .where('email', data.email)
        .where('system_id', system.id)
        .first();

      if (!user) {
        throw new BadRequestException(
          'Credenciais inválidas',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      if (!(await Hash.verify(user.password, data.password))) {
        throw new BadRequestException(
          'Credenciais inválidas',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      const roles = await this.getRoles(user, system.id, true);

      const validUnits = roles
        .map(r => r.unit)
        .filter(u => u !== null) as BusinessUnit[];

      const contextRole = roles.find(r => Boolean(r.role))?.role;
      if (!contextRole) {
        throw new BadRequestException(
          'Cargo não encontrado',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      if (validUnits.length === 1) {
        const [unit] = validUnits;
        if (reqIp) {
          const canAccess = await this.ipService.checkAccess(
            {
              role: contextRole,
              unit: unit.id,
              user: user.id,
            },
            reqIp,
          );
          if (!canAccess) {
            throw new BadRequestException(
              'Acesso não permitido para o IP informado',
              400,
              'E_IP_NOT_ALLOWED',
            );
          }
        }

        return auth.use('api').generate(user, {
          expiresIn: '7d',
          unit_id: unit.id,
          system_id: system.id,
        });
      }

      const uniqueEconomicGroups = await EconomicGroup.query().whereIn(
        'id',
        validUnits.map(u => u.economicGroupId),
      );

      const dataMap = new Map<string, BusinessUnit[]>();
      uniqueEconomicGroups.forEach(eg => dataMap.set(eg.id, []));
      validUnits.forEach(u => dataMap.get(u.economicGroupId)?.push(u));

      if (!data.business_unit_id) {
        const result = await Promise.all(
          Array.from(dataMap.keys()).map(async key => {
            const group = uniqueEconomicGroups.find(eg => eg.id === key);

            return {
              id: group?.id,
              userType: user.type,
              fantasyName: group?.fantasyName,
              companyName: group?.companyName,
              businessUnits: await Promise.all(
                dataMap.get(key)!.map(async bu => ({
                  id: bu.id,
                  identification: bu.identification,
                  status: 'VALID',
                })),
              ),
            };
          }),
        );

        if (result.length === 0) {
          throw new BadRequestException(
            'Credenciais inválidas',
            400,
            'E_BAD_CREDENTIALS',
          );
        }

        return result;
      }

      const unit = validUnits.find(u => u.id === data.business_unit_id);

      if (!unit) {
        throw new BadRequestException(
          'Credenciais inválidas',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      if (reqIp) {
        const canAccess = await this.ipService.checkAccess(
          {
            role: contextRole,
            unit: unit.id,
            user: user.id,
          },
          reqIp,
        );
        if (!canAccess) {
          throw new BadRequestException(
            'Acesso não permitido para o IP informado',
            400,
            'E_IP_NOT_ALLOWED',
          );
        }
      }

      return AuthService.generateAuthToken(auth, user, unit.id, system.id);
    });
  }

  public async controllerLogin(
    data: ILoginData,
    auth: AuthContract,
    reqIp?: string,
  ) {
    return Database.transaction(async trx => {
      const system = await System.query()
        .useTransaction(trx)
        .where('name', data.system)
        .firstOrFail();

      const user = await User.query()
        .useTransaction(trx)
        .where('email', data.email)
        .where('system_id', system.id)
        .first();

      if (!user || user.type !== 'controller') {
        throw new BadRequestException(
          'Credenciais inválidas',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      if (!(await Hash.verify(user.password, data.password))) {
        throw new BadRequestException(
          'Credenciais inválidas',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      const roles = await user
        .related('roles')
        .query()
        .preload('role', query => {
          query.preload('permissions', query => {
            query.where('status', true);
            query.where('type', 'controller');
          });
        })
        .preload('unit', query => {
          query.where('active', true);
        })
        .whereHas('unit', query => {
          query.where('active', true);
        })
        .whereHas('role', query => {
          query.whereIn('type', ['controller', 'both']);
        })
        .where('active', true);

      const validUnits = roles
        .map(r => r.unit)
        .filter(u => u !== null) as BusinessUnit[];

      const contextRole = roles.find(r => Boolean(r.role))?.role;
      if (!contextRole) {
        throw new BadRequestException(
          'Cargo não encontrado',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      if (validUnits.length === 1) {
        const [unit] = validUnits;
        if (reqIp) {
          const canAccess = await this.ipService.checkAccess(
            {
              role: contextRole,
              unit: unit.id,
              user: user.id,
            },
            reqIp,
          );
          if (!canAccess) {
            throw new BadRequestException(
              'Acesso não permitido para o IP informado',
              400,
              'E_IP_NOT_ALLOWED',
            );
          }
        }

        return auth.use('controllerApi').generate(user, {
          expiresIn: '7d',
        });
      }

      const uniqueEconomicGroups = await EconomicGroup.query().whereIn(
        'id',
        validUnits.map(u => u.economicGroupId),
      );

      const dataMap = new Map<string, BusinessUnit[]>();
      uniqueEconomicGroups.forEach(eg => dataMap.set(eg.id, []));
      validUnits.forEach(u => dataMap.get(u.economicGroupId)?.push(u));

      if (!data.business_unit_id) {
        const result = await Promise.all(
          Array.from(dataMap.keys()).map(async key => {
            const group = uniqueEconomicGroups.find(eg => eg.id === key);

            return {
              id: group?.id,
              userType: user.type,
              fantasyName: group?.fantasyName,
              companyName: group?.companyName,
              businessUnits: await Promise.all(
                dataMap.get(key)!.map(async bu => ({
                  id: bu.id,
                  identification: bu.identification,
                  status: 'VALID',
                })),
              ),
            };
          }),
        );

        if (result.length === 0) {
          throw new BadRequestException(
            'Credenciais inválidas',
            400,
            'E_BAD_CREDENTIALS',
          );
        }

        return result;
      }

      const unit = validUnits.find(u => u.id === data.business_unit_id);

      if (!unit) {
        throw new BadRequestException(
          'Credenciais inválidas',
          400,
          'E_BAD_CREDENTIALS',
        );
      }

      if (reqIp) {
        const canAccess = await this.ipService.checkAccess(
          {
            role: contextRole,
            unit: unit.id,
            user: user.id,
          },
          reqIp,
        );
        if (!canAccess) {
          throw new BadRequestException(
            'Acesso não permitido para o IP informado',
            400,
            'E_IP_NOT_ALLOWED',
          );
        }
      }

      return auth.use('controllerApi').generate(user, {
        expiresIn: '7d',
      });
    });
  }

  static generateAuthToken(
    auth: AuthContract,
    user: User,
    unit_id: string,
    system: number,
  ) {
    return auth.use('api').generate(user, {
      expiresIn: '7d',
      unit_id,
      system_id: system,
    });
  }

  public async getUser(data: ILoginData): Promise<User> {
    const user = await User.findBy('email', data.email);

    if (!user) {
      throw new BadRequestException(
        'Credenciais inválidas',
        400,
        'E_BAD_CREDENTIALS',
      );
    }

    if (!(await Hash.verify(user.password, data.password))) {
      throw new BadRequestException(
        'Credenciais inválidas',
        400,
        'E_BAD_CREDENTIALS',
      );
    }

    return user;
  }

  public async checkLicence(unit: BusinessUnit): Promise<string | null> {
    const licence = await unit
      .related('licences')
      .query()
      .where('active', true)
      .first();

    if (!licence) {
      return 'E_NO_LICENCE';
    }

    if (isAfter(new Date(), licence.expirationDate)) {
      if (licence.type === LicenceType.TRIAL) {
        return 'E_EXPIRED_TRIAL';
      }

      if (licence.type === LicenceType.ADDITIONAL_TRIAL) {
        return 'E_EXPIRED_ADDITIONAL_TRIAL';
      }

      return 'E_EXPIRED_LICENCE';
    }

    return null;
  }
}
