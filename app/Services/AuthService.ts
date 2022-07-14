import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import Env from '@ioc:Adonis/Core/Env';
import Hash from '@ioc:Adonis/Core/Hash';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import { LicenceType } from 'App/Models/Licence';
import User from 'App/Models/User';
import BusinessUnitService from 'App/Services/BusinessUnitService';
import ILoginData from 'Contracts/interfaces/ILoginData';
import { isAfter } from 'date-fns';

@inject()
export default class AuthService {
  constructor(private readonly businessUnitService: BusinessUnitService) {}

  public async login(data: ILoginData, auth: AuthContract) {
    const user = await this.getUser(data);
    const units = await this.businessUnitService.getUserBusinessUnits(user);

    if (units.length === 1) {
      const [unit] = units;

      const status = await this.checkLicence(unit);

      if (status) {
        throw new BadRequestException('Erro', 400, status);
      }

      return auth.use('api').generate(user, {
        expiresIn: Env.get('NODE_ENV') === 'production' ? '1hr' : '1d',
        unit_id: unit.id,
      });

    }

    if (!data.business_unit_id) {
      return Promise.all(
        units.map(async unit => {
          const result = await this.checkLicence(unit);

          return {
            id: unit.id,
            identification: unit.id,
            fantasy_name: unit.fantasyName,
            status: result ?? 'VALID',
          };
        }),
      );
    }

    const unit = units.find(u => u.id === data.business_unit_id);

    if (!unit) {
      throw new BadRequestException(
        'Credenciais inválidas',
        400,
        'E_BAD_CREDENTIALS',
      );
    }

    const status = await this.checkLicence(unit);

    if (status) {
      throw new BadRequestException('Erro', 400, status);
    }

    return AuthService.generateAuthToken(auth, user, unit.id);
  }

  static generateAuthToken(auth: AuthContract, user: User, unit_id: string) {
    return auth.use('api').generate(user, {
      expiresIn: Env.get('NODE_ENV') === 'production' ? '1hr' : '1d',
      unit_id,
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
