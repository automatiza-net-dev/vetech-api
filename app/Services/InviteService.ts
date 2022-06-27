import { inject } from '@adonisjs/fold';
import Mail from '@ioc:Adonis/Addons/Mail';
import Logger from '@ioc:Adonis/Core/Logger';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import UnauthorizedException from 'App/Exceptions/UnauthorizedException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Invite from 'App/Models/Invite';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import IInviteData from 'Contracts/interfaces/IInviteData';
import { v4 } from 'uuid';

@inject()
export default class InviteService {
  public async store(user: User, data: IInviteData): Promise<Invite> {
    const businessUnit = await this.getUserValidBusinessUnit(user, data);

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

  public async show(id: string): Promise<Invite> {
    const invite = await Invite.find(id);

    if (!invite) {
      throw new ResourceNotFoundException(
        'Convite não existe',
        404,
        'E_NOT_FOUND',
      );
    }

    return invite;
  }

  public async update(
    id: string,
    user: User,
    data: IInviteData,
  ): Promise<Invite> {
    const invite = await this.show(id);
    if (!invite.active) {
      throw new UnauthorizedException(
        'Convite não está mais ativo',
        401,
        'E_NOT_AUTHORIZED',
      );
    }

    const businessUnit = await this.getUserValidBusinessUnit(user, data);

    const role = await Role.findOrFail(data.role_id);
    const existingUser = await User.findBy('email', data.email);

    await Mail.send(message => {
      message
        .from('support@vetech.com')
        .to('gfreitasneto18@gmail.com') // TODO correct email for prod
        .subject('Convite - Vetech')
        .htmlView('emails/invite', { id });
    });

    return invite
      .merge({
        business_unit_id: businessUnit.id,
        email: data.email,
        role_id: role.id,
        user_id: existingUser?.id,
      })
      .save();
  }

  public async destroy(id: string, user: User): Promise<void> {
    const invite = await this.show(id);
    const inviteBusinessUnit = await invite
      .related('businessUnit')
      .query()
      .firstOrFail();
    const userBusinessUnits = await this.userBusinessUnits(user);

    this.userIsRelatedToBusinessUnit(userBusinessUnits, inviteBusinessUnit);

    await invite.softDelete();
  }

  private async getUserValidBusinessUnit(user: User, data: IInviteData) {
    const userBusinessUnits = await this.userBusinessUnits(user);
    const businessUnit = await BusinessUnit.findOrFail(data.business_unit_id);

    this.userIsRelatedToBusinessUnit(userBusinessUnits, businessUnit);

    return businessUnit;
  }

  private userIsRelatedToBusinessUnit(
    userBusinessUnits: Array<BusinessUnit>,
    businessUnit: BusinessUnit,
  ): void {
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
