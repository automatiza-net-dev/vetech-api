import { inject } from '@adonisjs/fold';
import { AuthContract, OpaqueTokenContract } from '@ioc:Adonis/Addons/Auth';
import Hash from '@ioc:Adonis/Core/Hash';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import User from 'App/Models/User';
import BusinessUnitService from 'App/Services/BusinessUnitService';
import ILoginData from 'Contracts/interfaces/ILoginData';

@inject()
export default class AuthService {
  constructor(private readonly businessUnitService: BusinessUnitService) {}

  public async login(
    data: ILoginData,
    auth: AuthContract,
  ): Promise<OpaqueTokenContract<User> | Array<BusinessUnit>> {
    const user = await this.getUser(data);
    const units = await this.businessUnitService.getUserBusinessUnits(user);

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
}
