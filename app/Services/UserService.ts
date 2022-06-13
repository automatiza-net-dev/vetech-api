import { inject } from '@adonisjs/fold';
import User from 'App/Models/User';

@inject()
export default class UserService {
  public async index(): Promise<Array<User>> {
    return User.all();
  }

  public async store(data): Promise<User> {
    return User.create(data);
  }

  public async show(id) {
    return User.find(id);
  }

  public async update(id, data) {
    const user: User | null = await this.show(id);

    if (user) {
      user.fill(data);
      return user.save();
    }
  }
}
