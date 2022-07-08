import { inject } from '@adonisjs/fold';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';

@inject()
export default class SharedService {
  public async getUserGroup(unitId: string): Promise<EconomicGroup> {
    const unit = await BusinessUnit.findOrFail(unitId);
    return unit.related('economicGroup').query().firstOrFail();
  }

  public async isSuperAdmin(user: User): Promise<boolean> {
    const roles = await user.related('roles').query().preload('role');
    return Boolean(roles.find(r => r.role?.name === 'super-admin'));
  }
}
