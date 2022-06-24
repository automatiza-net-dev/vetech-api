import { inject } from '@adonisjs/fold';
import { AuthContract, OpaqueTokenContract } from '@ioc:Adonis/Addons/Auth';
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

  public async login(
    data: ILoginData,
    auth: AuthContract,
  ): Promise<OpaqueTokenContract<User> | Array<BusinessUnit>> {
    const user = await this.getUser(data);
    const units = await this.businessUnitService.getUserBusinessUnits(user);

    if (units.length === 1) {
      await this.checkLicence(units[0]);

      return auth.use('api').generate(user, {
        expiresIn: '1h',
        unit_id: units[0].id,
      });
    }

    if (!data.business_unit_id) {
      return units;
    }

    const unit = units.find(u => u.id === data.business_unit_id);

    if (!unit) {
      throw new BadRequestException(
        'Credenciais inválidas',
        400,
        'E_BAD_CREDENTIALS',
      );
    }

    await this.checkLicence(unit);

    return auth.use('api').generate(user, {
      expiresIn: '1h',
      unit_id: unit.id,
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

  public async checkLicence(unit: BusinessUnit): Promise<void> {
    const licence = await unit
      .related('licences')
      .query()
      .where('active', true)
      .first();

    if (!licence) {
      throw new BadRequestException(
        'Clínica não tem licença ativa',
        400,
        'E_NO_LICENCE',
      );
    }

    if (isAfter(new Date(), licence.expirationDate)) {
      if (licence.type === LicenceType.TRIAL) {
        throw new BadRequestException(
          'Licença de teste já expirou',
          400,
          'E_EXPIRED_TRIAL',
        );
      }

      if (licence.type === LicenceType.ADDITIONAL_TRIAL) {
        throw new BadRequestException(
          'Licença de teste adicional já expirou',
          400,
          'E_EXPIRED_ADDITIONAL_TRIAL',
        );
      }

      throw new BadRequestException(
        'Licença expirada',
        400,
        'E_EXPIRED_LICENCE',
      );
    }
  }
}
