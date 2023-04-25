import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import UnauthorizedException from 'App/Exceptions/UnauthorizedException';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import System from 'App/Models/System';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export type DateSet = {
  start: Date;
  end: Date;
};

export type AuthContext = {
  user: User;
  group: EconomicGroup;
  system: System;
  unit: BusinessUnit;
};

@inject()
export default class SharedService {
  public async getUserGroup(unitId: string): Promise<EconomicGroup> {
    const unit = await BusinessUnit.findOrFail(unitId);
    return unit.related('economicGroup').query().firstOrFail();
  }

  public async getBUnit(unitId: string) {
    return BusinessUnit.query()
      .where('id', unitId)
      .preload('unitConfig')
      .firstOrFail();
  }

  public async isSuperAdmin(user: User): Promise<boolean> {
    const roles = await user.related('roles').query().preload('role');
    return Boolean(roles.find(r => r.role?.name === 'super-admin'));
  }

  public extractUser(auth: AuthContract): { user: User; unit_id: string } {
    const user = auth.use('api').user!;
    const { unit_id } = auth.use('api').token!.meta;

    return { user, unit_id };
  }

  public async getAuthContext(auth: AuthContract): Promise<AuthContext> {
    const { user, unit_id } = this.extractUser(auth);

    const unit = await BusinessUnit.query()
      .where('id', unit_id)
      .preload('economicGroup', query => {
        query.preload('system');
      })
      .firstOrFail();

    return {
      user,
      group: unit.economicGroup,
      system: unit.economicGroup.system,
      unit,
    };
  }

  public checkOverlapping(ASet: DateSet, BSet: DateSet): boolean {
    const firstMatch = ASet.start.getTime() < BSet.end.getTime();
    const secondMatch = BSet.start.getTime() < ASet.end.getTime();

    return firstMatch && secondMatch;
  }

  public checkDTEqt(date1: DateTime, date2: DateTime): boolean {
    return date1.toJSDate().getTime() === date2.toJSDate().getTime();
  }

  public ResourceNotFound(message = 'Recurso não encontrado') {
    return new ResourceNotFoundException(message, 404, 'E_NOT_FOUND');
  }

  public SystemResource() {
    return new UnauthorizedException(
      'Registro padrão do sistema. Não pode ser excluído nem alterado.',
      400,
      'E_SYSTEM',
    );
  }

  public async userHasRoles(user: User, roles: string[]): Promise<boolean> {
    const userRoles = await user
      .related('roles')
      .query()
      .where('active', true)
      .preload('role');

    return Boolean(userRoles.find(r => roles.includes(r.role?.name)));
  }

  public validDocument(document: string): boolean {
    const re =
      /([0-9]{2}[.]?[0-9]{3}[.]?[0-9]{3}[\\/]?[0-9]{4}[-]?[0-9]{2})|([0-9]{3}[.]?[0-9]{3}[.]?[0-9]{3}[-]?[0-9]{2})/;

    return re.test(document);
  }
}
