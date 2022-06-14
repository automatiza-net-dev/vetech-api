import { inject } from '@adonisjs/fold';
import Encryption from '@ioc:Adonis/Core/Encryption';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import UnauthorizedException from 'App/Exceptions/UnauthorizedException';
import User from 'App/Models/User';
import {
  IForgotPassword,
  IResetPassword,
} from 'Contracts/interfaces/ResetPassword';

@inject()
export default class UserService {
  public async index(): Promise<Array<User>> {
    return User.all();
  }

  public async store(data): Promise<User> {
    return User.create(data);
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

  public async update(id: string, data: any): Promise<User> {
    const user = await this.show(id);

    return user.merge(data).save();
  }

  public async delete(id: string): Promise<void> {
    const user = await this.show(id);

    await user.softDelete();
  }

  public async forgotPassword({ email }: IForgotPassword): Promise<void> {
    const encryptedEmail = Encryption.encrypt(email, '30min');
    console.log({ encryptedEmail });
    // TODO send email
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
