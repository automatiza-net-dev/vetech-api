import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import Hash from '@ioc:Adonis/Core/Hash';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';

@inject()
export default class ThirdPartyService {
  private unauthotizedException = new BadRequestException(
    'Credenciais inválidas',
    400,
    'E_INVALID',
  );

  public async authenticate(
    authContract: AuthContract,
    system: 'Vetech' | 'LiftOne' | 'Sanclá',
    data: {
      key: string;
      password: string;
    },
  ) {
    const tpUser = await ThirdPartyUserPermission.query()
      .where('key', data.key)
      .whereHas('system', query => {
        query.where('name', system);
      })
      .first();

    if (!tpUser) {
      throw this.unauthotizedException;
    }

    if (!(await Hash.verify(tpUser.password, data.password))) {
      throw this.unauthotizedException;
    }

    const token = await authContract.use('tpApi').generate(tpUser, {
      expiresIn: '1y',
    });

    return {
      token: token.token,
      expirates_at: token.expiresAt,
    };
  }
}
