import { inject } from '@adonisjs/fold';
import Mail from '@ioc:Adonis/Addons/Mail';
import Encryption from '@ioc:Adonis/Core/Encryption';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import UnauthorizedException from 'App/Exceptions/UnauthorizedException';
import { CheckingAccountType } from 'App/Models/CheckingAccount';
import ConfirmationToken from 'App/Models/ConfirmationToken';
import { LicenceType } from 'App/Models/Licence';
import {
  PaymentMethodTef,
  PaymentMethodType,
  PaymentMethodUsage,
} from 'App/Models/PaymentMethod';
import Plan from 'App/Models/Plan';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import { ICreateUser } from 'Contracts/interfaces/CreateUser';
import {
  IConfirmConfirmationToken,
  ICreateConfirmationToken,
} from 'Contracts/interfaces/IConfirmationToken';
import {
  IForgotPassword,
  IResetPassword,
} from 'Contracts/interfaces/ResetPassword';
import { IUpdatePassword } from 'Contracts/interfaces/UpdateUser';
import { SERVICE_VARIATION_GROUP_ID } from 'Database/seeders/ServiceSeeder';
import { addDays } from 'date-fns';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

interface ISearch {
  name?: string;
  email?: string;
  document?: string;
  phone?: string;
}

@inject()
export default class UserService {
  public async index(data: ISearch): Promise<Array<User>> {
    const qb = User.query();

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.email) {
      qb.where('email', 'ilike', `%${data.email}%`);
    }

    if (data.document) {
      qb.where('document', 'ilike', `%${data.document}%`);
    }

    if (data.phone) {
      qb.where('phone', 'ilike', `%${data.phone}%`);
    }

    return qb;
  }

  public async store(data: ICreateUser) {
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

    return Database.transaction(async trx => {
      const user = await User.create(data, {
        client: trx,
      });

      const newGroup = await user.related('economicGroups').create(
        {
          id: v4(),
          document: data.document,
          responsibleEmail: data.email,
          responsiblePhone: data.phone,
        },
        {},
        {
          client: trx,
        },
      );

      await newGroup.related('paymentMethods').createMany(
        [
          {
            description: 'Boleto',
            requiresDocument: false,
            tef: PaymentMethodTef.N,
            fee: 0,
            usage: PaymentMethodUsage.ENTRADA,
          },
          {
            description: 'Transferência / PIX',
            requiresDocument: false,
            tef: PaymentMethodTef.N,
            fee: 0,
            usage: PaymentMethodUsage.AMBOS,
          },
          {
            description: 'Cheque',
            requiresDocument: false,
            tef: PaymentMethodTef.N,
            fee: 0,
            usage: PaymentMethodUsage.ENTRADA,
          },
          {
            description: 'Dinheiro',
            requiresDocument: false,
            tef: PaymentMethodTef.N,
            fee: 0,
            usage: PaymentMethodUsage.AMBOS,
          },
          {
            description: 'Débito em Conta',
            requiresDocument: false,
            tef: PaymentMethodTef.N,
            fee: 0,
            usage: PaymentMethodUsage.ENTRADA,
          },
          {
            description: 'Crédito devolução',
            requiresDocument: true,
            tef: PaymentMethodTef.N,
            fee: 0,
            usage: PaymentMethodUsage.SAIDA,
          },
          {
            description: 'Cartão de Débito (POS)',
            requiresDocument: true,
            tef: PaymentMethodTef.P,
            type: PaymentMethodType.D,
            fee: 0,
            usage: PaymentMethodUsage.AMBOS,
          },
          {
            description: 'Cartão de Crédito (POS)',
            requiresDocument: true,
            tef: PaymentMethodTef.P,
            type: PaymentMethodType.C,
            fee: 0,
            usage: PaymentMethodUsage.AMBOS,
          },
        ],
        { client: trx },
      );

      const newBusinessUnit = await newGroup.related('businessUnits').create(
        {
          id: v4(),
          companyName: `Clínica do(a) ${user.name}`,
          document: data.document,
          phone: data.phone,
          email: data.email,
          origin: 'CADASTRO SELF-SERVICE',
        },
        {
          client: trx,
        },
      );

      await user.related('roles').create(
        {
          role_id: adminRole.id,
          unit_id: newBusinessUnit.id,
        },
        {
          client: trx,
        },
      );

      await newBusinessUnit.related('licences').create(
        {
          id: v4(),
          expirationDate: addDays(new Date(), 1000),
          type: LicenceType.TRIAL,
          active: true,
        },
        {
          client: trx,
        },
      );

      await newBusinessUnit.related('checkingAccounts').create(
        {
          description: `Cofre - Matriz`,
          accountNumber: 'Cofre',
          bankCode: 'Cofre',
          bankName: 'Cofre',
          agency: '001',
          type: CheckingAccountType.CX,
          balance: 0,
          active: true,
        },
        {
          client: trx,
        },
      );

      await newBusinessUnit.related('unitConfig').create({
        service_variation_group_id: SERVICE_VARIATION_GROUP_ID,
      });

      return { user, unit: newBusinessUnit };
    });
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

  public async checkExistingEmail(email: string) {
    const user = await User.findBy('email', email);
    if (!user) {
      return {
        exists: false,
        has_token: false,
      };
    }
    const token = await ConfirmationToken.query()
      .where('email', email)
      .where('expires_at', '>', new Date())
      .where('active', true)
      .first();

    return {
      exists: true,
      has_token: Boolean(token),
    };
  }

  public async resendConfirmationToken(email: string) {
    const user = await User.findBy('email', email);
    if (user) {
      throw new BadRequestException('Email cadastrado', 400, 'E_USER_EXISTS');
    }

    const token = await ConfirmationToken.query()
      .where('email', email)
      .where('expires_at', '>', new Date())
      .where('active', true)
      .first();

    if (!token) {
      throw new BadRequestException(
        'Sem token válido',
        400,
        'E_NO_VALID_TOKEN',
      );
    }

    await Mail.send(message => {
      message
        .from('sysvetech@gmail.com')
        .to(token.email)
        .subject('Confirmação de email')
        .htmlView('emails/confirmation_code', {
          name: token.name,
          code: token.code,
        });
    });
  }

  public async createConfirmationToken(
    data: ICreateConfirmationToken,
  ): Promise<number> {
    const code = Math.ceil(Math.random() * 10000)
      .toString()
      .padStart(6, '0');

    const existing = await ConfirmationToken.findBy('code', code);
    if (!existing) {
      await ConfirmationToken.create({
        name: data.name,
        phone: data.phone,
        code,
        email: data.email,
        expiresAt: DateTime.now().plus({ hour: 1 }),
      });
      await Mail.send(message => {
        message
          .from('sysvetech@gmail.com')
          .to(data.email)
          .subject('Confirmação de email')
          .htmlView('emails/confirmation_code', {
            name: data.name,
            code,
          });
      });

      return 1;
    }

    return this.createConfirmationToken(data);
  }

  public async confirmConfirmationToken(
    data: IConfirmConfirmationToken,
  ): Promise<void> {
    const token = await ConfirmationToken.query()
      .where('code', data.code)
      .andWhere('email', data.email)
      .first();

    if (!token) {
      throw new BadRequestException('Token não encontrado', 400, 'E_NO_TOKEN');
    }

    if (!token.active || token.expiresAt.diffNow('seconds').seconds < 0) {
      throw new BadRequestException('Token expirado', 400, 'E_EXPIRED_TOKEN');
    }

    token
      .merge({
        active: false,
        confirmedAt: DateTime.now(),
      })
      .save();
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
        .from('sysvetech@gmail.com')
        .to(email)
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
