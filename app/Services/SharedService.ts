import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';

export type DateSet = {
  start: Date;
  end: Date;
};

@inject()
export default class SharedService {
  public async getUserGroup(unitId: string): Promise<EconomicGroup> {
    const unit = await BusinessUnit.findOrFail(unitId);
    return unit.related('economicGroup').query().firstOrFail();
  }

  public async isSuperAdmin(user: User): Promise<boolean> {
    const roles = await user.related('roles').query().preload('role');
    return Boolean(roles.find(r => r.role.name === 'super-admin'));
  }

  public extractUser(auth: AuthContract): { user: User; unit_id: string } {
    const user = auth.use('api').user!;
    const { unit_id } = auth.use('api').token!.meta;

    return { user, unit_id };
  }

  public checkOverlapping(ASet: DateSet, BSet: DateSet): boolean {
    const firstMatch = ASet.start.getTime() < BSet.end.getTime();
    const secondMatch = BSet.start.getTime() < ASet.end.getTime();

    return firstMatch && secondMatch;
  }
}
