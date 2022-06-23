import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import UserUnitRole from 'App/Models/UserUnitRole';

@inject()
export default class UserRoleService {
  public async assignUnitRoleToUser(
    unit: BusinessUnit,
    role: Role,
    user: User,
  ): Promise<void> {
    const existingAssignedRole = await UserUnitRole.query()
      .where('user_id', user.id)
      .where('unit_id', unit.id)
      .where('role_id', role.id)
      .first();

    if (existingAssignedRole) {
      throw new BadRequestException('Cargo já existente', 400, 'E_BAD_REQUEST');
    }

    await UserUnitRole.create({
      user_id: user.id,
      role_id: role.id,
      unit_id: unit.id,
    });
  }

  public async getUnitUsers(id: string): Promise<Array<User>> {
    const entities = await UserUnitRole.query()
      .where('unit_id', id)
      .preload('user');

    return entities.map(ent => ent.user);
  }

  public async getUserBusinessUnits(user: User): Promise<Array<BusinessUnit>> {
    const entities = await user
      .related('economicGroups')
      .query()
      .preload('businessUnits');

    return entities.map(ent => ent.businessUnits).flat();
  }
}
