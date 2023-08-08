import { inject } from '@adonisjs/fold';
import IpAccessControl from 'App/Models/IpAccessControl';
import Role from 'App/Models/Role';
import { AuthContext } from 'App/Services/SharedService';

@inject()
export default class IpAccessControlService {
  constructor() {}

  public async store(
    authCtx: AuthContext,
    data: {
      ipAddress: string;
    },
  ) {
    await IpAccessControl.create({
      economic_group_id: authCtx.group.id,
      user_id: authCtx.user.id,

      ipAddress: data.ipAddress,
    });
  }

  public async checkAccess(
    props: {
      role: Role;
      group: string;
      user: string;
    },
    ip: string,
  ) {
    if (props.role.externalAccess) {
      return true;
    }

    const [count] = await IpAccessControl.query()
      .where('ip_address', ip)
      .where('economic_group_id', props.group)
      .where('active', true)
      .count('id');

    if (!count) {
      console.log(
        'IpAccessControlService.checkAccess: ',
        ip,
        props.group,
        count,
      );
      return false;
    }

    const realCount = parseInt(count.$extras.count ?? '0');

    return realCount > 0;
  }
}
