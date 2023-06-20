import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import Hash from '@ioc:Adonis/Core/Hash';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';

@inject()
export default class ThirdPartyService {
  public async authenticate(
    authContract: AuthContract,
    data: {
      key: string;
      password: string;
      systemId: number;
    },
  ) {
    const tpUser = await ThirdPartyUserPermission.query()
      .where('key', data.key)
      .where('system_id', data.systemId)
      .firstOrFail();

    if (!(await Hash.verify(tpUser.password, data.password))) {
      throw new BadRequestException('Credenciais inválidas', 400, 'E_INVALID');
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
