import { inject } from '@adonisjs/fold';
import Mail from '@ioc:Adonis/Addons/Mail';
import Encryption from '@ioc:Adonis/Core/Encryption';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import UnauthorizedException from 'App/Exceptions/UnauthorizedException';
import BusinessUnit from 'App/Models/BusinessUnit';
import { LicenceType } from 'App/Models/Licence';
import Plan from 'App/Models/Plan';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import BusinessUnitService from 'App/Services/BusinessUnitService';
import { ICreateUser } from 'Contracts/interfaces/CreateUser';
import {
  IForgotPassword,
  IResetPassword,
} from 'Contracts/interfaces/ResetPassword';
import { IUpdatePassword } from 'Contracts/interfaces/UpdateUser';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

@inject()
export default class UserService {
  constructor(private readonly unitService: BusinessUnitService) {}

  public async index(): Promise<Array<User>> {
    return User.all();
  }

  public async store(data: ICreateUser): Promise<[User, BusinessUnit]> {
    const adminRole = await Role.findBy('name', 'admin');
    if (!adminRole) {
      Logger.error('No admin role');
      // should have admin role
      throw new InternalErrorException(
        'Erro na criação de usuário',
        400,
        'E_INTERNAL_SERVER_ERROR',
      );
    }

    const trialPlan = await Plan.findBy('default', true);
    if (!trialPlan) {
      Logger.error('No trial plan');
      // should have admin role
      throw new InternalErrorException(
        'Erro na criação de usuário',
        400,
        'E_INTERNAL_SERVER_ERROR',
      );
    }

    await Database.transaction(async trx => {
      const user = await User.create(data, {
        client: trx,
      });

      const newGroup = await user.related('economicGroups').create({
        id: v4(),
        document: data.document,
        responsibleEmail: data.email,
        responsiblePhone: data.phone,
      });
      await newGroup.save();

      const newBusinessUnit = await newGroup.related('businessUnits').create({
        id: v4(),
        companyName: `Clínica do(a) ${user.name}`,
        document: data.document,
        phone: data.phone,
        email: data.email,
        origin: 'CADASTRO SELF-SERVICE',
      });
      await newBusinessUnit.save();

      await user.related('roles').create({
        role_id: adminRole.id,
        unit_id: newBusinessUnit.id,
      });

      await newBusinessUnit.related('licences').create({
        id: v4(),
        expirationDate: addDays(new Date(), trialPlan.trialDays),
        type: LicenceType.TRIAL,
        active: true,
      });
    });

    const createdUser = await User.findByOrFail('email', data.email);
    const [createdUnit] = await this.unitService.getUserBusinessUnits(
      createdUser,
    );
    return [createdUser, createdUnit];
  }

  public async show(id: string): Promise<User> {
    const user = await User.find(id);

    if (!user) {
      throw new ResourceNotFoundException(
        'The user was not found',
        404,
        'E_NOT_FOUND',
      );
    }

    return user;
  }

  public async checkExistingEmail(email: string): Promise<boolean> {
    const user = await User.findBy('email', email);
    return Boolean(user);
  }

  public async update(user: User, data: IUpdatePassword): Promise<User> {
    return user.merge(data).save();
  }

  public async delete(user: User): Promise<void> {
    await user.softDelete();
  }

  public async forgotPassword({ email }: IForgotPassword): Promise<void> {
    const encryptedEmail = Encryption.encrypt(email, '30min');
    await Mail.send(message => {
      message
        .from('support@vetech.com')
        .to('gfreitasneto18@gmail.com') // TODO correct email for prod
        .subject('Recuperação de Senha')
        .htmlView('emails/reset_password', { hash: encryptedEmail });
    });
  }

  public async resetPassword({
    hash,
    email,
    password,
  }: IResetPassword): Promise<void> {
    const decryptedEmail = Encryption.decrypt(hash);

    if (decryptedEmail !== email) {
      throw new UnauthorizedException('Token inválido', 400, 'E_UNAUTHORIZED');
    }

    const user = await User.findByOrFail('email', email);
    user.password = password;
    await user.save();
  }
}
