import { inject } from '@adonisjs/fold';
import Mail from '@ioc:Adonis/Addons/Mail';
import Logger from '@ioc:Adonis/Core/Logger';
import UnauthorizedException from 'App/Exceptions/UnauthorizedException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Invite from 'App/Models/Invite';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import ICreateInvite from 'Contracts/interfaces/ICreateInvite';
import { v4 } from 'uuid';

@inject()
export default class InvoiceService {
  public async store(user: User, data: ICreateInvite): Promise<Invite> {
    const userBusinessUnits = await this.userBusinessUnits(user);
    const businessUnit = await BusinessUnit.findOrFail(data.business_unit_id);

    const relatedBusinessUnit = userBusinessUnits.find(
      u => u.id === businessUnit.id,
    );

    if (!relatedBusinessUnit) {
      Logger.warn('Usuário não pode enviar convite');
      throw new UnauthorizedException(
        'Ação não permitida',
        401,
        'E_NOT_AUTHORIZED',
      );
    }

    const role = await Role.findOrFail(data.role_id);
    const existingUser = await User.findBy('email', data.email);
    const id = v4();

    await Mail.send(message => {
      message
        .from('support@vetech.com')
        .to('gfreitasneto18@gmail.com') // TODO correct email for prod
        .subject('Convite - Vetech')
        .htmlView('emails/invite', { id });
    });

    return businessUnit.related('invites').create({
      id,
      role_id: role.id,
      email: data.email,
      active: true,
      user_id: existingUser?.id,
    });
  }

  // TODO refactor to use from BusinessUnitService
  private async userBusinessUnits(user: User): Promise<Array<BusinessUnit>> {
    const entities = await user
      .related('economicGroups')
      .query()
      .preload('businessUnits');

    return entities.map(ent => ent.businessUnits).flat();
  }
}
