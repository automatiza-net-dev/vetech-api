import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import Hash from '@ioc:Adonis/Core/Hash';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';
import User from 'App/Models/User';

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

  public async extendedAuthenticate(
    authContract: AuthContract,
    system: 'Vetech' | 'LiftOne' | 'Sanclá',
    data: {
      appKey: string;
      appPassword: string;

      userEmail: string;
      userPassword: string;
    },
  ) {
    const tpUser = await ThirdPartyUserPermission.query()
      .where('key', data.appKey)
      .whereHas('system', query => {
        query.where('name', system);
      })
      .first();

    if (!tpUser) {
      throw this.unauthotizedException;
    }

    if (!(await Hash.verify(tpUser.password, data.appPassword))) {
      throw this.unauthotizedException;
    }

    const user = await User.query()
      .where('email', data.userEmail)
      .where('system_id', tpUser.system_id)
      .first();

    if (!user) {
      throw this.unauthotizedException;
    }

    if (!(await Hash.verify(user.password, data.userPassword))) {
      throw this.unauthotizedException;
    }

    const userToken = await authContract.use('api').generate(user, {
      expiresIn: '1w',
    });

    const appToken = await authContract.use('tpApi').generate(tpUser, {
      expiresIn: '1y',
    });

    return {
      app: {
        token: appToken.token,
        expirates_at: appToken.expiresAt,
      },
      user: {
        token: userToken.token,
        expirates_at: userToken.expiresAt,
      },
    };
  }
}
