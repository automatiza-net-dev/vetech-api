import { inject } from '@adonisjs/fold';
import IpAccessControl from 'App/Models/IpAccessControl';
import Role from 'App/Models/Role';
import { AuthContext } from 'App/Services/SharedService';

@inject()
export default class IpAccessControlService {
  constructor() {}

  public async index(authCtx: AuthContext) {
    return IpAccessControl.query()
      .preload('user', query => {
        query.select(['id', 'name', 'email']);
      })
      .preload('unit', query => {
        query.select(['id', 'identification']);
      })
      .where('business_unit_id', authCtx.unit.id)
      .where('active', true);
  }

  public async store(
    authCtx: AuthContext,
    data: {
      ipAddress: string;
    },
  ) {
    await IpAccessControl.create({
      business_unit_id: authCtx.unit.id,
      user_id: authCtx.user.id,

      ipAddress: data.ipAddress,
    });
  }

  public async checkAccess(
    props: {
      role: Role;
      unit: string;
      user: string;
    },
    ip: string,
  ) {
    if (props.role.externalAccess) {
      return true;
    }

    const [count] = await IpAccessControl.query()
      .debug(true)
      .where('ip_address', ip)
      .where('business_unit_id', props.unit)
      .where('active', true)
      .count('id');

    if (!count) {
      console.log(
        'IpAccessControlService.checkAccess: ',
        ip,
        props.unit,
        count,
      );
      return false;
    }

    const realCount = parseInt(count.$extras.count ?? '0');

    return realCount > 0;
  }
}
