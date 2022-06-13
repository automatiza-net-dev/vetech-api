import User from 'App/Models/User';

export default class UserService {

  public async index() {
    return User.all();
  }

  public async store(data) {
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
