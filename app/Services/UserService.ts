import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import User from 'App/Models/User';

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

  public async update(id, data) {
    const user: User | null = await this.show(id);

    if (user) {
      user.fill(data);
      return user.save();
    }
  }
}
